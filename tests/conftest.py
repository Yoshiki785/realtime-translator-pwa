"""
Pytest fixtures for dictionary CSV upload tests.

Test approach: B) MockFirestoreClient (via DEBUG_AUTH_BYPASS=1)
- Uses existing MockFirestoreClient in app.py
- No Firestore Emulator required
- FastAPI TestClient with multipart/form-data
"""
import os
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def set_test_env():
    """Set environment variables for testing."""
    # Enable DEBUG_AUTH_BYPASS for mock authentication and MockFirestoreClient
    os.environ["DEBUG_AUTH_BYPASS"] = "1"
    # Ensure not in production mode
    os.environ["ENV"] = "development"
    yield
    # Cleanup (optional)
    os.environ.pop("DEBUG_AUTH_BYPASS", None)


@pytest.fixture
def client():
    """Create FastAPI TestClient with fresh MockFirestoreClient state."""
    # Reset global Firestore client to ensure clean state
    import app
    app._firestore_client = None

    # Import app after setting env vars
    from app import app as fastapi_app
    return TestClient(fastapi_app)


@pytest.fixture
def mock_db():
    """Access the MockFirestoreClient's data for test setup/verification."""
    import app
    # Ensure client is initialized
    db = app.get_firestore_client()
    return db


def create_csv_content(rows: list[tuple[str, str, str]], with_header: bool = True) -> bytes:
    """Helper to create CSV content for upload.

    Args:
        rows: List of (source, target, note) tuples
        with_header: Whether to include header row

    Returns:
        CSV content as bytes
    """
    lines = []
    if with_header:
        lines.append("source,target,note")
    for source, target, note in rows:
        lines.append(f"{source},{target},{note}")
    return "\n".join(lines).encode("utf-8")


@pytest.fixture
def csv_helper():
    """Provide CSV creation helper function."""
    return create_csv_content


@pytest.fixture
def setup_user_with_count(mock_db):
    """Factory fixture to setup a user with specific dictionary count."""
    def _setup(uid: str, plan: str = "free", dictionary_count: int = 0):
        # Ensure user document exists with specified state
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": plan,
            "dictionaryCount": dictionary_count,
        })
        return user_ref
    return _setup


@pytest.fixture
def setup_existing_entries(mock_db):
    """Factory fixture to setup existing dictionary entries."""
    def _setup(uid: str, entries: list[dict]):
        """
        Args:
            uid: User ID
            entries: List of dicts with 'source', 'target', 'note' keys
        """
        entries_coll = mock_db.collection("users").document(uid).collection("dictionary")
        for entry in entries:
            doc_ref = entries_coll.document()
            doc_ref.set({
                "source": entry["source"],
                "target": entry["target"],
                "note": entry.get("note", ""),
                "sourceLower": entry["source"].lower(),
            })
    return _setup
