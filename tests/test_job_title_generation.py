"""
Tests for auto-title generation in /api/v1/jobs/complete endpoint.

Tests cover:
- title_status == "manual" is not overwritten
- title generation only runs when title is empty/unset
- fallback title is used on generation failure
"""
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime, timezone


def get_db_after_client(client):
    """Get the mock_db instance that the client will use."""
    import app
    return app.get_firestore_client()


def setup_running_job(mock_db, job_id: str, uid: str, extra_fields: dict = None):
    """Helper to create a running job in mock_db."""
    job_ref = mock_db.collection("jobs").document(job_id)
    job_data = {
        "uid": uid,
        "status": "running",
        "plan": "pro",
        "planAtStart": "pro",
        "reservedSeconds": 600,
        "reservedBaseSeconds": 600,
        "reservedTicketSeconds": 0,
        "startedAt": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc),
    }
    if extra_fields:
        job_data.update(extra_fields)
    job_ref.set(job_data)
    return job_ref


def setup_user_with_active_job(mock_db, uid: str, job_id: str):
    """Helper to create a user with an active job."""
    user_ref = mock_db.collection("users").document(uid)
    user_ref.set({
        "plan": "pro",
        "activeJobId": job_id,
        "activeJobStartedAt": datetime.now(timezone.utc),
        "monthKey": "2026-01",
        "usedBaseSecondsThisMonth": 0,
        "dayKey": "2026-01-27",
        "usedSecondsToday": 0,
        "creditSeconds": 0,
    })
    return user_ref


class TestJobTitleGeneration:
    """Tests for auto-title generation on job completion."""

    @patch('app.generate_title_for_job')
    def test_complete_generates_title_when_empty(self, mock_generate, client):
        """Test that title is generated when job has no title."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-test-1"

        # Setup running job without title
        setup_running_job(mock_db, job_id, uid)
        setup_user_with_active_job(mock_db, uid, job_id)

        # Mock successful title generation
        mock_generate.return_value = {
            "title": "Generated Test Title",
            "title_status": "auto",
            "title_model": "gpt-4o-mini",
            "title_source": "transcript_head",
            "title_prompt_version": "v1",
        }

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "This is a test transcript",
                "outputLang": "ja",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data.get("title") == "Generated Test Title"
        assert data.get("title_status") == "auto"

        # Verify generate_title_for_job was called
        mock_generate.assert_called_once()

    @patch('app.generate_title_for_job')
    def test_complete_does_not_overwrite_manual_title(self, mock_generate, client):
        """Test that manual titles are not overwritten."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-manual-1"

        # Setup running job WITH manual title
        setup_running_job(mock_db, job_id, uid, {
            "title": "My Manual Title",
            "title_status": "manual",
        })
        setup_user_with_active_job(mock_db, uid, job_id)

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "Some transcript",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data.get("title") == "My Manual Title"
        assert data.get("title_status") == "manual"

        # Verify generate_title_for_job was NOT called
        mock_generate.assert_not_called()

    @patch('app.generate_title_for_job')
    def test_complete_does_not_regenerate_auto_title(self, mock_generate, client):
        """Test that existing auto titles are not regenerated."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-auto-existing"

        # Setup running job WITH existing auto title
        setup_running_job(mock_db, job_id, uid, {
            "title": "Existing Auto Title",
            "title_status": "auto",
        })
        setup_user_with_active_job(mock_db, uid, job_id)

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

        # Verify generate_title_for_job was NOT called (existing auto title)
        mock_generate.assert_not_called()

    @patch('app.generate_title_for_job')
    def test_complete_uses_fallback_on_generation_failure(self, mock_generate, client):
        """Test that fallback title is used when generation fails."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-fail-1"

        # Setup running job without title
        setup_running_job(mock_db, job_id, uid)
        setup_user_with_active_job(mock_db, uid, job_id)

        # Mock failed title generation
        mock_generate.return_value = {
            "title": "",
            "title_status": "failed",
            "title_model": "gpt-4o-mini",
            "title_source": "transcript_head",
            "title_prompt_version": "v1",
        }

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "Test transcript for fallback",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data.get("title_status") == "failed"
        # Fallback title should be set (contains date and text head)
        assert data.get("title") is not None
        assert len(data.get("title", "")) > 0

    @patch('app.generate_title_for_job')
    def test_complete_handles_generation_exception(self, mock_generate, client):
        """Test that exceptions during generation result in fallback title."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-exception-1"

        # Setup running job without title
        setup_running_job(mock_db, job_id, uid)
        setup_user_with_active_job(mock_db, uid, job_id)

        # Mock exception during title generation
        mock_generate.side_effect = Exception("API Error")

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "Test transcript",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        # Should have fallback title even on exception
        assert data.get("title") is not None or data.get("title_status") == "failed"

    @patch('app.generate_title_for_job')
    def test_complete_does_not_call_llm_when_pending(self, mock_generate, client):
        """Test that LLM is NOT called when title_status is already 'pending'.

        This simulates a race condition where another request has already
        acquired the title generation lock by setting title_status='pending'.
        """
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-pending-lock"

        # Setup running job WITH title_status='pending' (simulating another request has lock)
        setup_running_job(mock_db, job_id, uid, {
            "title": "",  # Empty title
            "title_status": "pending",  # Another request is generating
        })
        setup_user_with_active_job(mock_db, uid, job_id)

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "This should not trigger LLM",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        # Title status should remain pending (we didn't get the lock)
        assert data.get("title_status") == "pending"

        # CRITICAL: Verify generate_title_for_job was NOT called (lock not acquired)
        mock_generate.assert_not_called()

    @patch('app.generate_title_for_job')
    def test_complete_acquires_lock_and_generates_title(self, mock_generate, client):
        """Test that lock is acquired and LLM is called when title_status is empty."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-title-lock-acquired"

        # Setup running job WITHOUT title_status (should acquire lock)
        setup_running_job(mock_db, job_id, uid, {
            "title": "",
            # No title_status - should acquire lock
        })
        setup_user_with_active_job(mock_db, uid, job_id)

        # Mock successful title generation
        mock_generate.return_value = {
            "title": "Lock Acquired Title",
            "title_status": "auto",
            "title_model": "gpt-4o-mini",
            "title_source": "transcript_head",
            "title_prompt_version": "v1",
        }

        response = client.post(
            "/api/v1/jobs/complete",
            json={
                "jobId": job_id,
                "audioSeconds": 60,
                "transcriptHead": "This should trigger LLM",
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data.get("title") == "Lock Acquired Title"
        assert data.get("title_status") == "auto"

        # Verify generate_title_for_job WAS called (lock acquired)
        mock_generate.assert_called_once()

        # Verify Firestore has the correct title_status (not pending anymore)
        job_ref = mock_db.collection("jobs").document(job_id)
        job_data = job_ref.get().to_dict()
        assert job_data.get("title_status") == "auto"
        assert job_data.get("title") == "Lock Acquired Title"


class TestJobTitleUpdate:
    """Tests for manual title update endpoint."""

    def test_update_title_sets_manual_status(self, client):
        """Test that updating title sets title_status to manual."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-update-title-1"

        # Setup completed job with auto title
        job_ref = mock_db.collection("jobs").document(job_id)
        job_ref.set({
            "uid": uid,
            "status": "completed",
            "title": "Auto Generated Title",
            "title_status": "auto",
        })

        response = client.patch(
            f"/api/v1/jobs/{job_id}/title",
            json={"title": "My Custom Title"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "My Custom Title"
        assert data["title_status"] == "manual"

        # Verify Firestore was updated
        job_data = job_ref.get().to_dict()
        assert job_data["title"] == "My Custom Title"
        assert job_data["title_status"] == "manual"

    def test_update_title_requires_non_empty(self, client):
        """Test that empty title is rejected."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"
        job_id = "job-update-title-empty"

        # Setup job
        job_ref = mock_db.collection("jobs").document(job_id)
        job_ref.set({
            "uid": uid,
            "status": "completed",
            "title": "Old Title",
        })

        response = client.patch(
            f"/api/v1/jobs/{job_id}/title",
            json={"title": ""}
        )

        assert response.status_code == 400

    def test_update_title_rejects_other_users_job(self, client):
        """Test that users cannot update other users' job titles."""
        mock_db = get_db_after_client(client)
        job_id = "job-other-user"

        # Setup job owned by different user
        job_ref = mock_db.collection("jobs").document(job_id)
        job_ref.set({
            "uid": "other-user",  # Different from debug-user
            "status": "completed",
            "title": "Original Title",
        })

        response = client.patch(
            f"/api/v1/jobs/{job_id}/title",
            json={"title": "Hacked Title"}
        )

        assert response.status_code == 403

    def test_update_title_returns_404_for_missing_job(self, client):
        """Test that 404 is returned for non-existent job."""
        response = client.patch(
            "/api/v1/jobs/nonexistent-job/title",
            json={"title": "New Title"}
        )

        assert response.status_code == 404
