"""
Dictionary CSV Upload Regression Tests

Test approach: MockFirestoreClient (DEBUG_AUTH_BYPASS=1)

These tests verify the upload_dictionary_csv endpoint handles:
- Partial success with plan limits (Case 1)
- No available slots (Case 2)
- All duplicates (Case 3)
- Transaction failures (Case 4)
"""
import io
import pytest
from unittest.mock import patch


class TestDictionaryUploadCSV:
    """Test cases for /api/v1/dictionary/upload endpoint."""

    def test_case1_free_plan_truncates_to_limit(
        self, client, mock_db, csv_helper, setup_user_with_count
    ):
        """
        Case 1: Free(limit=10), current_count=0, CSV 20 rows (no duplicates)

        Expected:
        - HTTP 200
        - added == 10
        - truncatedByLimit == 10
        - requestedUnique == 20
        - partialSuccess == True
        - warning contains "Truncated"
        """
        uid = "debug-user"  # DEBUG_AUTH_BYPASS always returns this UID

        # Setup: Free user with 0 entries
        setup_user_with_count(uid, plan="free", dictionary_count=0)

        # Create CSV with 20 unique rows
        rows = [(f"source{i}", f"target{i}", f"note{i}") for i in range(20)]
        csv_content = csv_helper(rows, with_header=True)

        # Upload
        response = client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

        data = response.json()
        assert data["added"] == 10, f"Expected added=10, got {data['added']}"
        assert data.get("truncatedByLimit") == 10, f"Expected truncatedByLimit=10, got {data.get('truncatedByLimit')}"
        assert data.get("requestedUnique") == 20, f"Expected requestedUnique=20, got {data.get('requestedUnique')}"
        assert data.get("partialSuccess") is True, "Expected partialSuccess=True"
        assert "Truncated" in data.get("warning", ""), f"Expected 'Truncated' in warning, got: {data.get('warning')}"
        assert data["count"] == 10, f"Expected final count=10, got {data['count']}"
        assert data["limit"] == 10, f"Expected limit=10 (free plan), got {data['limit']}"

    def test_case2_no_available_slots(
        self, client, mock_db, csv_helper, setup_user_with_count
    ):
        """
        Case 2: current_count == limit (0 available slots), CSV 5 rows (no duplicates)

        Expected:
        - HTTP 200
        - added == 0
        - partialSuccess == True
        - warning contains "No available slots"
        """
        uid = "debug-user"

        # Setup: Free user already at limit (10/10)
        setup_user_with_count(uid, plan="free", dictionary_count=10)

        # Create CSV with 5 unique rows
        rows = [(f"new_source{i}", f"new_target{i}", "") for i in range(5)]
        csv_content = csv_helper(rows, with_header=True)

        # Upload
        response = client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.json()}"

        data = response.json()
        assert data["added"] == 0, f"Expected added=0, got {data['added']}"
        assert data.get("partialSuccess") is True, "Expected partialSuccess=True"
        assert "No available slots" in data.get("warning", ""), f"Expected 'No available slots' in warning, got: {data.get('warning')}"

    def test_case3_all_duplicates(
        self, client, csv_helper
    ):
        """
        Case 3: requested_unique == 0 (all entries are duplicates - DB existing or CSV internal)

        Expected:
        - HTTP 400
        - detail.reason == "all_duplicates"
        """
        uid = "debug-user"

        # Reset mock DB for clean state
        import app
        app._firestore_client = None
        mock_db = app.get_firestore_client()

        # Setup: User with 2 existing entries
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({"plan": "free", "dictionaryCount": 2})

        entries_coll = mock_db.collection("users").document(uid).collection("dictionary")
        entries_coll.document().set({
            "source": "hello", "target": "konnichiwa", "note": "", "sourceLower": "hello"
        })
        entries_coll.document().set({
            "source": "goodbye", "target": "sayonara", "note": "", "sourceLower": "goodbye"
        })

        # Create CSV with ONLY duplicates (all exist in DB)
        rows = [
            ("hello", "konnichiwa_v2", ""),    # DB duplicate (source matches)
            ("HELLO", "konnichiwa_v3", ""),    # Case-insensitive duplicate
            ("goodbye", "sayonara_v2", ""),    # DB duplicate
        ]
        csv_content = csv_helper(rows, with_header=True)

        # Upload
        response = client.post(
            "/api/v1/dictionary/upload",
            files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
        )

        # Assert
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.json()}"

        data = response.json()
        detail = data.get("detail", {})
        assert detail.get("reason") == "all_duplicates", f"Expected reason='all_duplicates', got: {detail}"

    def test_case4_transaction_failed(self, client, csv_helper):
        """
        Case 4: All chunks fail (total_added == 0 and failed_chunks > 0)

        Expected:
        - HTTP 500
        - detail.reason == "transaction_failed"
        - detail.failedChunks >= 1
        """
        uid = "debug-user"

        # Reset mock DB for clean state
        import app
        app._firestore_client = None
        mock_db = app.get_firestore_client()

        # Setup: User with some available slots
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({"plan": "free", "dictionaryCount": 0})

        # Create CSV with some entries
        rows = [(f"src{i}", f"tgt{i}", "") for i in range(3)]
        csv_content = csv_helper(rows, with_header=True)

        # Mock _upload_dictionary_chunk_simple to always raise an exception
        with patch("app._upload_dictionary_chunk_simple") as mock_chunk:
            mock_chunk.side_effect = Exception("Simulated transaction failure")

            # Upload
            response = client.post(
                "/api/v1/dictionary/upload",
                files={"file": ("test.csv", io.BytesIO(csv_content), "text/csv")},
            )

        # Assert
        assert response.status_code == 500, f"Expected 500, got {response.status_code}: {response.json()}"

        data = response.json()
        detail = data.get("detail", {})
        assert detail.get("reason") == "transaction_failed", f"Expected reason='transaction_failed', got: {detail}"
        assert detail.get("failedChunks", 0) >= 1, f"Expected failedChunks >= 1, got: {detail.get('failedChunks')}"
