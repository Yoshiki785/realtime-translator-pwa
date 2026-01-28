"""
Integration Tests for Dictionary CSV Upload (Firestore Emulator)

These tests run against the real Firestore Emulator to validate:
- Real transaction behavior
- Firestore "in" query semantics
- Consistency under actual Firestore operations

Prerequisites:
- Firebase CLI installed
- Firestore Emulator running: firebase emulators:start --only firestore --project demo-test
- Environment variables set:
  - FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
  - GCLOUD_PROJECT=demo-test (optional, defaults to demo-test)
  - DEBUG_AUTH_BYPASS=1 (for auth bypass)
  - ENV=development
"""
import io
import os
import uuid
from datetime import datetime, timezone

import pytest

# Skip entire module if emulator is not available
EMULATOR_HOST = os.getenv("FIRESTORE_EMULATOR_HOST")
if not EMULATOR_HOST:
    pytest.skip(
        "Firestore Emulator not available (FIRESTORE_EMULATOR_HOST not set)",
        allow_module_level=True
    )

from google.cloud import firestore
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def emulator_db():
    """Create Firestore client connected to emulator."""
    project = os.getenv("GCLOUD_PROJECT", "demo-test")
    client = firestore.Client(project=project)
    yield client


@pytest.fixture(scope="module")
def integration_client():
    """Create FastAPI TestClient for integration tests."""
    # Reset global client to ensure fresh state
    import app
    app._firestore_client = None

    from app import app as fastapi_app
    return TestClient(fastapi_app)


@pytest.fixture
def test_uid():
    """Generate unique UID for test isolation."""
    return f"it-user-{uuid.uuid4().hex[:12]}"


@pytest.fixture
def seed_user(emulator_db):
    """Factory fixture to seed a user document."""
    created_users = []

    def _seed(uid: str, plan: str = "free", dictionary_count: int = 0):
        user_ref = emulator_db.collection("users").document(uid)
        user_ref.set({
            "plan": plan,
            "dictionaryCount": dictionary_count,
            "createdAt": datetime.now(timezone.utc),
        })
        created_users.append(uid)
        return user_ref

    yield _seed

    # Cleanup: delete created users and their subcollections
    for uid in created_users:
        _cleanup_user(emulator_db, uid)


@pytest.fixture
def seed_dictionary_entries(emulator_db):
    """Factory fixture to seed dictionary entries."""
    seeded = []

    def _seed(uid: str, entries: list[dict]):
        """
        Args:
            uid: User ID
            entries: List of dicts with 'source', 'target', 'note' keys
                     Optionally include 'sourceLower' (omit for legacy test)
        """
        entries_coll = emulator_db.collection("users").document(uid).collection("dictionary")
        for entry in entries:
            doc_ref = entries_coll.document()
            doc_data = {
                "source": entry["source"],
                "target": entry["target"],
                "note": entry.get("note", ""),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            # Include sourceLower unless explicitly testing legacy
            if "sourceLower" in entry:
                doc_data["sourceLower"] = entry["sourceLower"]
            elif entry.get("include_source_lower", True):
                doc_data["sourceLower"] = entry["source"].lower()
            doc_ref.set(doc_data)
            seeded.append((uid, doc_ref.id))
        return entries_coll

    yield _seed


def _cleanup_user(db, uid: str):
    """Delete user document and all subcollection documents."""
    user_ref = db.collection("users").document(uid)

    # Delete dictionary subcollection
    dict_coll = user_ref.collection("dictionary")
    for doc in dict_coll.stream():
        doc.reference.delete()

    # Delete user document
    user_ref.delete()


def _count_dictionary_docs(db, uid: str) -> int:
    """Count documents in user's dictionary subcollection."""
    entries_coll = db.collection("users").document(uid).collection("dictionary")
    return len(list(entries_coll.stream()))


def _get_user_dictionary_count(db, uid: str) -> int:
    """Get dictionaryCount field from user document."""
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    if doc.exists:
        return doc.to_dict().get("dictionaryCount", 0)
    return 0


def create_csv_content(rows: list[tuple[str, str, str]], with_header: bool = True) -> bytes:
    """Helper to create CSV content for upload."""
    lines = []
    if with_header:
        lines.append("source,target,note")
    for source, target, note in rows:
        lines.append(f"{source},{target},{note}")
    return "\n".join(lines).encode("utf-8")


class TestDictionaryUploadIntegration:
    """Integration tests for /api/v1/dictionary/upload against Firestore Emulator."""

    def test_it1_limit_truncation_end_to_end(
        self, integration_client, emulator_db, seed_user
    ):
        """
        IT-1: Limit truncation end-to-end

        Setup: plan=free (limit=10), dictionaryCount=0, no existing docs.
        Upload: CSV with 20 unique rows.

        Expected:
        - HTTP 200
        - added == 10
        - partialSuccess == True
        - truncatedByLimit == 10
        - requestedUnique == 20
        - warning contains "Truncated"

        DB verification:
        - dictionary subcollection has exactly 10 docs
        - user dictionaryCount == 10
        """
        # Use fixed UID that DEBUG_AUTH_BYPASS returns
        uid = "debug-user"

        # Clean up any existing data for this UID first
        _cleanup_user(emulator_db, uid)

        # Seed user with free plan, 0 entries
        seed_user(uid, plan="free", dictionary_count=0)

        # Create CSV with 20 unique rows
        rows = [(f"it1_source_{i}", f"it1_target_{i}", f"note_{i}") for i in range(20)]
        csv_content = create_csv_content(rows, with_header=True)

        # Upload
        response = integration_client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert response
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

        data = response.json()
        assert data["added"] == 10, f"Expected added=10, got {data['added']}"
        assert data.get("partialSuccess") is True, "Expected partialSuccess=True"
        assert data.get("truncatedByLimit") == 10, f"Expected truncatedByLimit=10, got {data.get('truncatedByLimit')}"
        assert data.get("requestedUnique") == 20, f"Expected requestedUnique=20, got {data.get('requestedUnique')}"
        assert "Truncated" in data.get("warning", ""), f"Expected 'Truncated' in warning, got: {data.get('warning')}"

        # Verify DB state
        actual_doc_count = _count_dictionary_docs(emulator_db, uid)
        assert actual_doc_count == 10, f"Expected 10 docs in DB, got {actual_doc_count}"

        actual_user_count = _get_user_dictionary_count(emulator_db, uid)
        assert actual_user_count == 10, f"Expected user dictionaryCount=10, got {actual_user_count}"

        # Cleanup
        _cleanup_user(emulator_db, uid)

    def test_it2_all_duplicates_returns_400(
        self, integration_client, emulator_db, seed_user, seed_dictionary_entries
    ):
        """
        IT-2: All duplicates returns 400

        Setup: dictionaryCount matches existing docs, all CSV rows are duplicates.
        Upload: CSV rows that all exist in DB (source match, case-insensitive).

        Expected:
        - HTTP 400
        - detail.reason == "all_duplicates"

        This validates "all_duplicates before slots check" under real Firestore.
        """
        uid = "debug-user"

        # Clean up first
        _cleanup_user(emulator_db, uid)

        # Seed user with 3 existing entries
        seed_user(uid, plan="free", dictionary_count=3)

        # Seed existing dictionary entries
        existing_entries = [
            {"source": "hello", "target": "konnichiwa", "note": "", "sourceLower": "hello"},
            {"source": "goodbye", "target": "sayonara", "note": "", "sourceLower": "goodbye"},
            {"source": "thanks", "target": "arigatou", "note": "", "sourceLower": "thanks"},
        ]
        seed_dictionary_entries(uid, existing_entries)

        # Create CSV with ONLY duplicates (all exist in DB)
        rows = [
            ("hello", "konnichiwa_v2", ""),      # DB duplicate
            ("HELLO", "konnichiwa_v3", ""),      # Case-insensitive duplicate
            ("goodbye", "sayonara_v2", ""),      # DB duplicate
            ("thanks", "arigatou_v2", ""),       # DB duplicate
        ]
        csv_content = create_csv_content(rows, with_header=True)

        # Upload
        response = integration_client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.json()}"

        data = response.json()
        detail = data.get("detail", {})
        assert detail.get("reason") == "all_duplicates", f"Expected reason='all_duplicates', got: {detail}"

        # Cleanup
        _cleanup_user(emulator_db, uid)

    def test_it3_legacy_fallback_duplicate_detection(
        self, integration_client, emulator_db, seed_user
    ):
        """
        IT-3: Legacy fallback duplicate detection

        Setup: Create existing dictionary doc WITHOUT sourceLower field
               (simulating pre-migration data).
        Upload: CSV contains that source + a new source.

        Expected:
        - Only new entry added (legacy duplicate skipped)
        - duplicatesSkipped increments
        - DB count increments by 1
        """
        uid = "debug-user"

        # Clean up first
        _cleanup_user(emulator_db, uid)

        # Seed user
        seed_user(uid, plan="free", dictionary_count=1)

        # Create legacy entry WITHOUT sourceLower (direct Firestore write)
        entries_coll = emulator_db.collection("users").document(uid).collection("dictionary")
        legacy_doc = entries_coll.document()
        legacy_doc.set({
            "source": "legacy_word",
            "target": "legacy_translation",
            "note": "",
            # Intentionally NO sourceLower field
            "createdAt": datetime.now(timezone.utc),
        })

        # Create CSV with legacy duplicate + new entry
        rows = [
            ("legacy_word", "new_translation", ""),  # Should be detected as duplicate via fallback
            ("brand_new_word", "brand_new_translation", ""),  # Should be added
        ]
        csv_content = create_csv_content(rows, with_header=True)

        # Upload
        response = integration_client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert response
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

        data = response.json()
        assert data["added"] == 1, f"Expected added=1 (only new entry), got {data['added']}"
        assert data.get("duplicatesSkipped", 0) >= 1, f"Expected duplicatesSkipped>=1, got {data.get('duplicatesSkipped')}"

        # Verify DB state: should have 2 docs total (legacy + new)
        actual_doc_count = _count_dictionary_docs(emulator_db, uid)
        assert actual_doc_count == 2, f"Expected 2 docs in DB, got {actual_doc_count}"

        # Cleanup
        _cleanup_user(emulator_db, uid)
