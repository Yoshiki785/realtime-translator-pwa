"""
Tests for idempotent /api/v1/jobs/create endpoint.

Tests cover:
- No active job: create returns new job (reused=false or omitted)
- Active job exists: create returns existing job (reused=true, status=running)
- GET /api/v1/jobs/active: returns current active job or 404
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone


def get_db_after_client(client):
    """Get the mock_db instance that the client will use.

    Must be called AFTER client fixture is created to ensure same instance.
    """
    import app
    return app.get_firestore_client()


class TestJobCreateIdempotent:
    """Tests for idempotent job creation."""

    def test_create_job_no_active_job(self, client):
        """Test that create returns new job when no active job exists."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid
        # Setup user with no active job
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": None,
            "activeJobStartedAt": None,
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
            "dayKey": "2026-01-27",
            "dailyUsedSeconds": 0,
        })

        response = client.post("/api/v1/jobs/create")

        assert response.status_code == 200
        data = response.json()
        assert "jobId" in data
        assert data["status"] == "running"
        # reused should be False or omitted (not True)
        assert data.get("reused") is not True

    def test_create_job_active_job_exists_returns_existing(self, client):
        """Test that create returns existing job when active job exists (idempotent)."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid
        existing_job_id = "existing-job-123"

        # Setup existing running job
        job_ref = mock_db.collection("jobs").document(existing_job_id)
        job_ref.set({
            "uid": uid,
            "status": "running",
            "plan": "pro",
            "reservedSeconds": 600,
            "reservedBaseSeconds": 600,
            "reservedTicketSeconds": 0,
            "maxSessionSeconds": 600,
            "retentionDays": 7,
            "reservedDailyLimitSeconds": None,
            "createdAt": datetime.now(timezone.utc),
        })

        # Setup user with active job
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": existing_job_id,
            "activeJobStartedAt": datetime.now(timezone.utc),
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
            "dayKey": "2026-01-27",
            "dailyUsedSeconds": 0,
        })

        response = client.post("/api/v1/jobs/create")

        assert response.status_code == 200
        data = response.json()
        assert data["jobId"] == existing_job_id
        assert data["status"] == "running"
        assert data["reused"] is True

    def test_create_job_stale_active_job_creates_new(self, client):
        """Test that create clears stale activeJobId and creates new job."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid
        stale_job_id = "stale-job-123"

        # Setup user with stale activeJobId (job doesn't exist)
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": stale_job_id,
            "activeJobStartedAt": datetime.now(timezone.utc),
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
            "dayKey": "2026-01-27",
            "dailyUsedSeconds": 0,
        })
        # Note: job document does NOT exist

        response = client.post("/api/v1/jobs/create")

        assert response.status_code == 200
        data = response.json()
        assert data["jobId"] != stale_job_id  # New job created
        assert data["status"] == "running"
        assert data.get("reused") is not True


class TestGetActiveJob:
    """Tests for GET /api/v1/jobs/active endpoint."""

    def test_get_active_job_exists(self, client):
        """Test that GET /jobs/active returns active job when exists."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid
        active_job_id = "active-job-456"

        # Setup running job
        job_ref = mock_db.collection("jobs").document(active_job_id)
        job_ref.set({
            "uid": uid,
            "status": "running",
            "plan": "pro",
            "reservedSeconds": 600,
            "reservedBaseSeconds": 600,
            "reservedTicketSeconds": 0,
            "maxSessionSeconds": 600,
            "retentionDays": 7,
            "reservedDailyLimitSeconds": None,
            "createdAt": datetime.now(timezone.utc),
        })

        # Setup user with active job
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": active_job_id,
            "activeJobStartedAt": datetime.now(timezone.utc),
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
            "dayKey": "2026-01-27",
            "dailyUsedSeconds": 0,
        })

        response = client.get("/api/v1/jobs/active")

        assert response.status_code == 200
        data = response.json()
        assert data["jobId"] == active_job_id
        assert data["status"] == "running"

    def test_get_active_job_none_exists(self, client):
        """Test that GET /jobs/active returns 404 when no active job."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid

        # Setup user with no active job
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": None,
            "activeJobStartedAt": None,
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
        })

        response = client.get("/api/v1/jobs/active")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"] == "no_active_job"

    def test_get_active_job_completed_job_returns_404(self, client):
        """Test that GET /jobs/active returns 404 if job is already completed."""
        mock_db = get_db_after_client(client)
        uid = "debug-user"  # Must match DEBUG_AUTH_BYPASS uid
        completed_job_id = "completed-job-789"

        # Setup completed job
        job_ref = mock_db.collection("jobs").document(completed_job_id)
        job_ref.set({
            "uid": uid,
            "status": "completed",  # Already completed
            "plan": "pro",
            "reservedSeconds": 600,
            "reservedBaseSeconds": 600,
            "reservedTicketSeconds": 0,
        })

        # Setup user with stale activeJobId pointing to completed job
        user_ref = mock_db.collection("users").document(uid)
        user_ref.set({
            "plan": "pro",
            "activeJobId": completed_job_id,
            "activeJobStartedAt": datetime.now(timezone.utc),
            "monthKey": "2026-01",
            "baseUsedThisMonth": 0,
        })

        response = client.get("/api/v1/jobs/active")

        assert response.status_code == 404
        data = response.json()
        assert data["detail"]["error"] == "no_active_job"

        # Verify activeJobId was cleared
        user_doc = user_ref.get()
        user_data = user_doc.to_dict()
        assert user_data.get("activeJobId") is None
