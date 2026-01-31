import asyncio
import base64
import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

import firebase_admin
import httpx
import stripe
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore as firebase_firestore
from google.cloud import storage as gcs_storage

# ログ設定（構造化ログ）
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)


import re

def mask_secrets(text: str) -> str:
    """ek_, sk-, OPENAI_API_KEY などの秘匿情報をマスクする"""
    # ek_... (ephemeral key)
    text = re.sub(r'\bek_[A-Za-z0-9_-]{6,}', lambda m: m.group(0)[:6] + '***', text)
    # sk-... (OpenAI API key)
    text = re.sub(r'\bsk-[A-Za-z0-9_-]{6,}', lambda m: m.group(0)[:6] + '***', text)
    # Bearer tokens
    text = re.sub(r'Bearer\s+[A-Za-z0-9_.-]{10,}', 'Bearer ***', text)
    return text

# Load environment variables from .env file
load_dotenv()

# 環境判定（本番ではセキュリティガード有効）
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"
SERVICE_NAME = os.getenv("SERVICE_NAME", "realtime-translator-api")
APP_VERSION = os.getenv("APP_VERSION") or os.getenv("COMMIT_SHA") or "local"

def get_openai_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable must be set")
    return api_key

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
DOWNLOAD_DIR = BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

JST = ZoneInfo("Asia/Tokyo")

PLANS = {
    "free": {
        "quotaSeconds": 1800,
        "retentionDays": 7,
        "baseMonthlyQuotaSeconds": 1800,
        "baseDailyQuotaSeconds": 600,
        "maxSessionSeconds": 600,
        "maxConcurrentJobs": 1,
        "createRateLimitPerMin": 6,
    },
    "pro": {
        "quotaSeconds": 7200,
        "retentionDays": 30,
        "baseMonthlyQuotaSeconds": 7200,
        "baseDailyQuotaSeconds": None,
        "maxSessionSeconds": 7200,
        "maxConcurrentJobs": 1,
        "createRateLimitPerMin": 12,
    },
}

FINAL_JOB_STATUSES = {"succeeded", "completed", "failed", "stopped_quota", "expired"}

_firestore_client = None
_storage_client = None
_mock_db = {}  # In-memory mock database for DEBUG_AUTH_BYPASS mode

ICON_192_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAABiklEQVR42u3TMQ0AAAjAMBxw4gH//sAE"
    "Hz1qYMkiqwe+ChEwABgADAAGAAOAAcAAYAAwABgADAAGAAOA"
    "AcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAA"
    "OAAcAAYAAwABgADIABRMAAYAAwABgADAAGAAOAAcAAYAAwABgA"
    "DAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwAB"
    "gADAAGAAOAAcAAYAAwAAYAA4ABwABgADAAGAAMAAYAA4ABwABg"
    "ADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwAB"
    "gADAAGAAMAAYAA4ABMIAIGAAMAAYAA4ABwABgADAAGAAMAAYA"
    "A4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAaASwsdQ3sFUwQJzwAAAABJRU5ErkJggg=="
)

ICON_512_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAG40lEQVR42u3WIQEAAAjAMBog6UD/flAC"
    "x8QKXD2yegCAX0IEADAAAIABAAAMAABgAAAAAwAAGAAAwAAA"
    "AAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwA"
    "AGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwAAGAAAMAAAAAG"
    "AAAwAACAAQAADAAAYAAAAAMAABgAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAIABAAAMAABg"
    "AAAAAwAAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAA"
    "wAAAAAYAADAAAIABAAADIAQAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAIAB"
    "AAAMAABgAAAAAwAABkAEADAAAIABAAAMAABgAAAAAwAAGAAA"
    "wAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAGAAAAADAAAYAADAAAAABgAAMAAAgAEA"
    "AAwAAGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwAAGAAAMAA"
    "AAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAIABAAAM"
    "AABgAAAAAwAAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAA"
    "GAAAwAAAAAYAADAAAIABAAADIAQAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAA"
    "AIABAAAMAABgAAAAAwAABkAEADAAAIABAAAMAABgAAAAAwAA"
    "GAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAGAAAAADAAAYAADAAAAABgAAMAAA"
    "gAEAAAwAAGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwAAGAA"
    "AMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAIAB"
    "AAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAIABAAAMAABgAAAA"
    "AwAAGAAAwAAAAAYAADAAAIABAAADIAQAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYA"
    "ADAAAIABAAAMAABgAAAAAwAABkAEADAAAIABAAAMAABgAAAA"
    "AwAAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAGAAAAADAAAYAADAAAAABgAA"
    "MAAAgAEAAAwAAGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwA"
    "AGAAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAA"
    "AIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAIABAAAMAABg"
    "AAAAAwAAGAAAwAAAAAYAADAAAIABAAADIAQAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAAwAAA"
    "AAYAADAAAIABAAAMAABgAAAAAwAABkAEADAAAIABAAAMAABg"
    "AAAAAwAAGAAAwAAAAAYAADAAAIABAAAMAABgAAAAAwAAGAAA"
    "wAAAAAYAADAAAGAAAAADAAAYAADAAAAABgAAMAAAgAEAAAwAAGAAAAADAAAYAADAAAAABgAAMAAAgAEA"
    "AAwAAGAAAMAAAAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAA"
    "AAAGAAAwAACAAQAADAAAYAAAAAMAABgAAMAAAIABAAAMAABgAAAAAwAAGAAAwAAAAAYAADAAAIABAAAM"
    "AABgAAAAAwAAGAAAwAAAAAYAALizBPNOhYgtpTgAAAAASUVORK5CYII="
)


def ensure_icon(path: Path, b64_data: str) -> None:
    if path.exists():
        return
    path.write_bytes(base64.b64decode(b64_data))

def ensure_firebase_app() -> None:
    if firebase_admin._apps:
        return
    try:
        firebase_admin.initialize_app()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail="firebase_not_configured") from exc


class MockServerTimestamp:
    """Mock for firebase_firestore.SERVER_TIMESTAMP"""
    pass


MOCK_SERVER_TIMESTAMP = MockServerTimestamp()


class MockFirestoreClient:
    """Mock Firestore client for DEBUG_AUTH_BYPASS mode"""
    def __init__(self):
        self.data = {}

    def collection(self, name):
        if name not in self.data:
            self.data[name] = {}
        return MockCollection(self.data[name])

    def transaction(self):
        return MockTransaction(self.data)


class MockCollection:
    def __init__(self, data):
        self.data = data

    def document(self, doc_id):
        return MockDocument(self.data, doc_id)

    def where(self, field, op, value):
        return MockQuery(self.data, field, op, value)


class MockDocument:
    def __init__(self, data, doc_id):
        self.data = data
        self.doc_id = doc_id
        self.id = doc_id
        self.reference = self

    def get(self, transaction=None):
        return MockSnapshot(self.data.get(self.doc_id), self.doc_id)

    def set(self, data, merge=False):
        processed_data = self._process_timestamps(data)
        if self.doc_id in self.data and merge:
            self.data[self.doc_id].update(processed_data)
        else:
            self.data[self.doc_id] = processed_data.copy()

    def update(self, data):
        if self.doc_id in self.data:
            processed_data = self._process_timestamps(data)
            self.data[self.doc_id].update(processed_data)

    def _process_timestamps(self, data):
        """Replace SERVER_TIMESTAMP placeholders with actual datetime"""
        processed = {}
        for key, value in data.items():
            if isinstance(value, MockServerTimestamp) or (hasattr(firebase_firestore, 'SERVER_TIMESTAMP') and value is firebase_firestore.SERVER_TIMESTAMP):
                processed[key] = datetime.now(timezone.utc)
            else:
                processed[key] = value
        return processed

    def delete(self):
        if self.doc_id in self.data:
            del self.data[self.doc_id]

    def to_dict(self):
        return self.data.get(self.doc_id, {})


class MockSnapshot:
    def __init__(self, data, doc_id):
        self.data = data
        self.doc_id = doc_id
        self.exists = data is not None

    def to_dict(self):
        return self.data.copy() if self.data else None


class MockQuery:
    def __init__(self, data, field, op, value):
        self.data = data
        self.field = field
        self.op = op
        self.value = value
        self._limit = None

    def limit(self, count):
        self._limit = count
        return self

    def stream(self):
        results = []
        for doc_id, doc_data in self.data.items():
            if self._matches(doc_data):
                results.append(MockDocumentSnapshot(doc_data, doc_id, self.data))
                if self._limit and len(results) >= self._limit:
                    break
        return results

    def _matches(self, doc_data):
        field_value = doc_data.get(self.field)
        if self.op == "<":
            return field_value < self.value
        elif self.op == "<=":
            return field_value <= self.value
        elif self.op == "==":
            return field_value == self.value
        elif self.op == ">":
            return field_value > self.value
        elif self.op == ">=":
            return field_value >= self.value
        return False


class MockDocumentSnapshot:
    def __init__(self, data, doc_id, collection_data):
        self.data = data
        self.doc_id = doc_id
        self.reference = MockDocument(collection_data, doc_id)

    def to_dict(self):
        return self.data.copy() if self.data else None


class MockTransaction:
    def __init__(self, data):
        self.data = data
        self._read_only = False
        self._write_pbs = []
        self._id = None

    def get(self, doc_ref, transaction=None):
        return doc_ref.get()

    def set(self, doc_ref, data, merge=False):
        doc_ref.set(data, merge)

    def update(self, doc_ref, data):
        doc_ref.update(data)

    def _begin(self):
        """Mock transaction begin"""
        pass

    def _commit(self):
        """Mock transaction commit"""
        pass

    def _rollback(self):
        """Mock transaction rollback"""
        pass


def get_firestore_client():
    global _firestore_client

    # 【セキュリティガード】本番環境ではMockFirestoreを強制無効化
    use_mock = False
    if not IS_PRODUCTION:
        use_mock = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if use_mock:
        if _firestore_client is None:
            logger.warning("Using MockFirestoreClient - development only!")
            _firestore_client = MockFirestoreClient()
        return _firestore_client

    if _firestore_client is not None:
        return _firestore_client

    # 本番環境ではGOOGLE_APPLICATION_CREDENTIALS_JSONから認証情報を読み込む
    if IS_PRODUCTION:
        creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
        if creds_json:
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
                f.write(creds_json)
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = f.name

    ensure_firebase_app()
    _firestore_client = firebase_firestore.client()
    return _firestore_client


def get_storage_client() -> gcs_storage.Client:
    global _storage_client
    if _storage_client is not None:
        return _storage_client
    ensure_firebase_app()
    _storage_client = gcs_storage.Client()
    return _storage_client


def now_jst() -> datetime:
    return datetime.now(tz=JST)


def month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def day_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def next_month_start_utc(dt: datetime) -> datetime:
    """Calculate the first moment of next month in JST, return as UTC datetime."""
    # Ensure we're working in JST
    dt_jst = dt.astimezone(JST) if dt.tzinfo else dt.replace(tzinfo=JST)
    # First day of next month at 00:00:00 JST
    if dt_jst.month == 12:
        next_month = dt_jst.replace(year=dt_jst.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        next_month = dt_jst.replace(month=dt_jst.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    # Convert to UTC
    return next_month.astimezone(timezone.utc)


def safe_int(value, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value == 1
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def usage_doc_id(uid: str, yyyymm: str) -> str:
    return f"{uid}_{yyyymm}"


def normalize_plan(plan: str | None) -> str:
    if plan in PLANS:
        return plan
    return "free"


def resolve_plan_config(plan: str | None) -> dict:
    return PLANS[normalize_plan(plan)]


def ensure_user_profile(uid: str) -> dict:
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    snap = user_ref.get()
    data = snap.to_dict() if snap.exists else {}
    plan = normalize_plan(data.get("plan"))
    plan_config = resolve_plan_config(plan)
    quota_seconds = int(data.get("quotaSeconds", plan_config["baseMonthlyQuotaSeconds"]))
    retention_days = int(data.get("retentionDays", plan_config["retentionDays"]))
    subscription_status = data.get("subscriptionStatus", "free")

    updates = {}
    if not snap.exists:
        updates["createdAt"] = firebase_firestore.SERVER_TIMESTAMP
    if data.get("plan") != plan:
        updates["plan"] = plan
    if data.get("quotaSeconds") != quota_seconds:
        updates["quotaSeconds"] = quota_seconds
    if data.get("retentionDays") != retention_days:
        updates["retentionDays"] = retention_days
    if data.get("subscriptionStatus") != subscription_status:
        updates["subscriptionStatus"] = subscription_status
    if updates:
        updates["updatedAt"] = firebase_firestore.SERVER_TIMESTAMP
        user_ref.set(updates, merge=True)

    return {
        "plan": plan,
        "quotaSeconds": quota_seconds,
        "retentionDays": retention_days,
        "subscriptionStatus": subscription_status,
    }


def get_used_seconds(db: firebase_firestore.Client, uid: str, yyyymm: str) -> int:
    usage_ref = db.collection("usage_monthly").document(usage_doc_id(uid, yyyymm))
    snap = usage_ref.get()
    data = snap.to_dict() if snap.exists else {}
    used = data.get("usedSeconds", 0)
    try:
        return int(used)
    except (TypeError, ValueError):
        return 0


def normalize_user_usage_data(
    raw_data: dict | None,
    current_jst: datetime,
    is_new: bool,
) -> tuple[dict, dict, str, dict]:
    state = dict(raw_data or {})
    updates: dict[str, object] = {}
    plan = normalize_plan(state.get("plan"))
    if state.get("plan") != plan:
        updates["plan"] = plan
    state["plan"] = plan
    plan_config = resolve_plan_config(plan)

    today = day_key(current_jst)
    if state.get("dayKey") != today:
        updates["dayKey"] = today
        updates["usedSecondsToday"] = 0
        state["dayKey"] = today
        state["usedSecondsToday"] = 0
    else:
        used_today = max(0, safe_int(state.get("usedSecondsToday"), 0))
        if state.get("usedSecondsToday") != used_today:
            updates["usedSecondsToday"] = used_today
        state["usedSecondsToday"] = used_today

    month = month_key(current_jst)
    if state.get("monthKey") != month:
        updates["monthKey"] = month
        updates["usedBaseSecondsThisMonth"] = 0
        state["monthKey"] = month
        state["usedBaseSecondsThisMonth"] = 0
    else:
        used_base = max(0, safe_int(state.get("usedBaseSecondsThisMonth"), 0))
        if state.get("usedBaseSecondsThisMonth") != used_base:
            updates["usedBaseSecondsThisMonth"] = used_base
        state["usedBaseSecondsThisMonth"] = used_base

    ticket_balance = max(0, safe_int(state.get("ticketSecondsBalance"), 0))
    if state.get("ticketSecondsBalance") != ticket_balance:
        updates["ticketSecondsBalance"] = ticket_balance
    state["ticketSecondsBalance"] = ticket_balance

    if "activeJobId" not in state:
        state["activeJobId"] = None
        updates["activeJobId"] = None
    if "activeJobStartedAt" not in state:
        state["activeJobStartedAt"] = None
        updates["activeJobStartedAt"] = None

    job_create_count = max(0, safe_int(state.get("jobCreateCount"), 0))
    if state.get("jobCreateCount") != job_create_count:
        updates["jobCreateCount"] = job_create_count
    state["jobCreateCount"] = job_create_count
    if "jobCreateMinuteKey" not in state:
        state["jobCreateMinuteKey"] = None
        updates["jobCreateMinuteKey"] = None

    if is_new:
        updates["createdAt"] = firebase_firestore.SERVER_TIMESTAMP

    return state, updates, plan, plan_config


def apply_user_updates(
    user_ref: firebase_firestore.DocumentReference,
    updates: dict,
    transaction: firebase_firestore.Transaction | MockTransaction | None = None,
) -> None:
    if not updates:
        return
    payload = dict(updates)
    payload["updatedAt"] = firebase_firestore.SERVER_TIMESTAMP
    if transaction is not None:
        transaction.set(user_ref, payload, merge=True)
    else:
        user_ref.set(payload, merge=True)


def read_user_state(
    db: firebase_firestore.Client,
    uid: str,
    current_jst: datetime,
    transaction: firebase_firestore.Transaction | MockTransaction | None = None,
) -> tuple[firebase_firestore.DocumentReference, dict, str, dict]:
    user_ref = db.collection("users").document(uid)
    if transaction is not None:
        snap = user_ref.get(transaction=transaction)
    else:
        snap = user_ref.get()
    state, updates, plan, plan_config = normalize_user_usage_data(
        snap.to_dict() if snap.exists else {},
        current_jst,
        not snap.exists,
    )
    if updates:
        apply_user_updates(user_ref, updates, transaction)
    return user_ref, state, plan, plan_config


def to_utc_datetime(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    return None


def build_quota_snapshot(user_state: dict, plan_config: dict) -> dict:
    base_monthly = plan_config.get("baseMonthlyQuotaSeconds", 0)
    base_used = safe_int(user_state.get("usedBaseSecondsThisMonth"), 0)
    base_remaining = max(0, base_monthly - base_used)
    ticket_balance = max(0, safe_int(user_state.get("ticketSecondsBalance"), 0))
    total_available = base_remaining + ticket_balance
    daily_cap = plan_config.get("baseDailyQuotaSeconds")
    used_today = safe_int(user_state.get("usedSecondsToday"), 0)
    if daily_cap is None:
        daily_remaining = None
    else:
        daily_remaining = max(0, daily_cap - used_today)

    return {
        "baseMonthlyQuotaSeconds": base_monthly,
        "usedBaseSecondsThisMonth": base_used,
        "baseRemainingThisMonth": base_remaining,
        "ticketSecondsBalance": ticket_balance,
        "totalAvailableThisMonth": total_available,
        "baseDailyQuotaSeconds": daily_cap,
        "usedSecondsToday": used_today,
        "dailyRemainingSeconds": daily_remaining,
    }


def get_document_id(doc_ref) -> str | None:
    doc_id = getattr(doc_ref, "id", None)
    if doc_id:
        return doc_id
    return getattr(doc_ref, "doc_id", None)


def _create_job_core(
    db: firebase_firestore.Client,
    uid: str,
    job_id: str,
    current_jst: datetime,
    now_utc: datetime,
    force_takeover: bool = False,
    transaction: firebase_firestore.Transaction | MockTransaction | None = None,
) -> dict:
    force_takeover_used = False
    while True:
        user_ref, user_state, plan, plan_config = read_user_state(db, uid, current_jst, transaction)
        snapshot = build_quota_snapshot(user_state, plan_config)
        base_remaining = snapshot["baseRemainingThisMonth"]
        ticket_balance = snapshot["ticketSecondsBalance"]
        total_available = snapshot["totalAvailableThisMonth"]

        if total_available <= 0:
            raise HTTPException(
                status_code=402,
                detail={
                    "error": "no_remaining_minutes",
                    "message": "No remaining minutes (monthly base + tickets exhausted)",
                },
            )

        daily_cap = plan_config.get("baseDailyQuotaSeconds")
        daily_remaining = snapshot["dailyRemainingSeconds"] if daily_cap is not None else None
        if daily_cap is not None and (daily_remaining is None or daily_remaining <= 0):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "daily_limit_reached",
                    "message": "Daily limit reached (10 min/day)",
                },
            )

        minute_key = current_jst.strftime("%Y-%m-%dT%H:%M")
        create_limit = safe_int(plan_config.get("createRateLimitPerMin"), 0)
        stored_minute = user_state.get("jobCreateMinuteKey")
        create_count = safe_int(user_state.get("jobCreateCount"), 0)
        if stored_minute != minute_key:
            stored_minute = minute_key
            create_count = 0
        if create_limit and create_count >= create_limit:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limited",
                    "message": "Too many job requests this minute",
                },
            )

        max_session = plan_config.get("maxSessionSeconds", 600)
        active_job_id = user_state.get("activeJobId")
        active_job_started_at = to_utc_datetime(user_state.get("activeJobStartedAt"))
        if active_job_id:
            grace_window = max_session + 120
            should_block = True
            if active_job_started_at is None:
                should_block = False
            else:
                elapsed = (now_utc - active_job_started_at).total_seconds()
                should_block = elapsed <= grace_window
            if should_block and force_takeover:
                if force_takeover_used:
                    raise HTTPException(status_code=409, detail={"error": "active_job_in_progress"})
                job_ref = db.collection("jobs").document(active_job_id)
                _complete_job_core(db, job_ref, uid, None, current_jst, now_utc, transaction)
                force_takeover_used = True
                continue
            if should_block:
                raise HTTPException(status_code=409, detail={"error": "active_job_in_progress"})
        break

    reserved_seconds = min(total_available, max_session)
    if daily_remaining is not None:
        reserved_seconds = min(reserved_seconds, daily_remaining)
    reserved_seconds = max(0, int(reserved_seconds))
    if reserved_seconds <= 0:
        raise HTTPException(
            status_code=402,
            detail={"error": "no_reservable_minutes", "message": "No minutes available for reservation"},
        )

    retention_days = plan_config.get("retentionDays", 7)
    delete_at = (current_jst + timedelta(days=retention_days)).astimezone(timezone.utc)

    reserved_base = min(base_remaining, reserved_seconds)
    reserved_ticket = max(0, reserved_seconds - reserved_base)

    create_count += 1
    user_state["jobCreateMinuteKey"] = stored_minute
    user_state["jobCreateCount"] = create_count

    user_updates = {
        "activeJobId": job_id,
        "activeJobStartedAt": firebase_firestore.SERVER_TIMESTAMP,
        "jobCreateMinuteKey": stored_minute,
        "jobCreateCount": create_count,
    }
    apply_user_updates(user_ref, user_updates, transaction)

    job_ref = db.collection("jobs").document(job_id)
    job_data = {
        "uid": uid,
        "status": "running",
        "plan": plan,
        "planAtStart": plan,
        "reservedSeconds": reserved_seconds,
        "reservedBaseSeconds": reserved_base,
        "reservedTicketSeconds": reserved_ticket,
        "reservedDailyLimitSeconds": daily_cap,
        "totalAvailableSecondsAtStart": total_available,
        "baseRemainingSecondsAtStart": base_remaining,
        "ticketSecondsBalanceAtStart": ticket_balance,
        "dailyRemainingSecondsAtStart": daily_remaining,
        "monthKey": user_state.get("monthKey"),
        "dayKey": user_state.get("dayKey"),
        "maxSessionSeconds": max_session,
        "retentionDays": retention_days,
        "deleteAt": delete_at,
        "startedAt": firebase_firestore.SERVER_TIMESTAMP,
        "createdAt": firebase_firestore.SERVER_TIMESTAMP,
        "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
    }

    if transaction is not None:
        transaction.set(job_ref, job_data)
    else:
        job_ref.set(job_data)

    response = {
        "jobId": job_id,
        "status": "running",
        "plan": plan,
        "reservedSeconds": reserved_seconds,
        "reservedBaseSeconds": reserved_base,
        "reservedTicketSeconds": reserved_ticket,
        "baseRemainingThisMonth": base_remaining,
        "ticketSecondsBalance": ticket_balance,
        "totalAvailableThisMonth": total_available,
        "baseMonthlyQuotaSeconds": snapshot["baseMonthlyQuotaSeconds"],
        "baseDailyQuotaSeconds": daily_cap,
        "dailyRemainingSeconds": daily_remaining,
        "maxSessionSeconds": max_session,
        "retentionDays": retention_days,
        "monthKey": user_state.get("monthKey"),
    }
    return response


def create_job_transaction_simple(
    db: firebase_firestore.Client,
    uid: str,
    job_id: str,
    current_jst: datetime,
    now_utc: datetime,
    force_takeover: bool = False,
) -> dict:
    return _create_job_core(
        db, uid, job_id, current_jst, now_utc, force_takeover=force_takeover, transaction=None
    )


@firebase_firestore.transactional
def create_job_transaction(
    transaction: firebase_firestore.Transaction,
    db: firebase_firestore.Client,
    uid: str,
    job_id: str,
    current_jst: datetime,
    now_utc: datetime,
    force_takeover: bool = False,
) -> dict:
    return _create_job_core(
        db, uid, job_id, current_jst, now_utc, force_takeover=force_takeover, transaction=transaction
    )


def _complete_job_core(
    db: firebase_firestore.Client,
    job_ref,
    uid: str,
    reported_seconds: int | None,
    current_jst: datetime,
    now_utc: datetime,
    transaction: firebase_firestore.Transaction | MockTransaction | None = None,
) -> dict:
    job_id_value = get_document_id(job_ref) or "unknown"
    job_snap = job_ref.get(transaction=transaction)
    if not job_snap.exists:
        raise HTTPException(status_code=404, detail="job_not_found")
    job_data = job_snap.to_dict() or {}
    if job_data.get("uid") != uid:
        raise HTTPException(status_code=403, detail="forbidden")

    status = job_data.get("status", "running")
    if status in FINAL_JOB_STATUSES:
        return {"status": status, "jobId": job_id_value, "skipped": True}

    plan_at_start = normalize_plan(job_data.get("planAtStart") or job_data.get("plan"))
    plan_config_start = resolve_plan_config(plan_at_start)
    reserved_seconds = max(
        0,
        safe_int(job_data.get("reservedSeconds"), plan_config_start.get("maxSessionSeconds", 600)),
    )
    reserved_base = max(0, safe_int(job_data.get("reservedBaseSeconds"), reserved_seconds))
    reserved_ticket = max(
        0,
        safe_int(job_data.get("reservedTicketSeconds"), reserved_seconds - reserved_base),
    )
    if reserved_base + reserved_ticket < reserved_seconds:
        reserved_ticket = max(0, reserved_seconds - reserved_base)

    started_at = to_utc_datetime(job_data.get("startedAt"))
    actual_seconds = None
    if started_at:
        actual_seconds = max(0, int((now_utc - started_at).total_seconds()))
    if reported_seconds is not None:
        reported_seconds = max(0, int(reported_seconds))
    if actual_seconds is None:
        actual_seconds = reported_seconds if reported_seconds is not None else reserved_seconds
    billed_seconds = min(actual_seconds, reserved_seconds)
    billed_base = min(billed_seconds, reserved_base)
    billed_ticket = max(0, billed_seconds - billed_base)

    user_ref, user_state, plan_current, plan_config_current = read_user_state(
        db, uid, current_jst, transaction
    )

    ticket_balance_before = safe_int(user_state.get("ticketSecondsBalance"), 0)
    new_ticket_balance = ticket_balance_before - billed_ticket
    anomaly = False
    if new_ticket_balance < 0:
        anomaly = True
        new_ticket_balance = 0

    new_base_used = safe_int(user_state.get("usedBaseSecondsThisMonth"), 0) + billed_base
    new_used_today = safe_int(user_state.get("usedSecondsToday"), 0) + billed_seconds

    user_updates = {
        "usedBaseSecondsThisMonth": new_base_used,
        "usedSecondsToday": new_used_today,
        "ticketSecondsBalance": new_ticket_balance,
    }
    user_state["usedBaseSecondsThisMonth"] = new_base_used
    user_state["usedSecondsToday"] = new_used_today
    user_state["ticketSecondsBalance"] = new_ticket_balance

    if user_state.get("activeJobId") == job_id_value:
        user_updates["activeJobId"] = None
        user_updates["activeJobStartedAt"] = None
        user_state["activeJobId"] = None
        user_state["activeJobStartedAt"] = None

    apply_user_updates(user_ref, user_updates, transaction)

    job_updates = {
        "status": "completed",
        "completedAt": firebase_firestore.SERVER_TIMESTAMP,
        "endedAt": firebase_firestore.SERVER_TIMESTAMP,
        "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
        "actualSeconds": actual_seconds,
        "billedSeconds": billed_seconds,
        "billedBaseSeconds": billed_base,
        "billedTicketSeconds": billed_ticket,
        "planAtCompletion": plan_current,
    }
    if reported_seconds is not None:
        job_updates["reportedSeconds"] = reported_seconds

    if transaction is not None:
        transaction.update(job_ref, job_updates)
    else:
        job_ref.update(job_updates)

    snapshot = build_quota_snapshot(user_state, plan_config_current)
    response = {
        "status": "completed",
        "plan": plan_current,
        "jobId": job_id_value,
        "planAtStart": plan_at_start,
        "planAtCompletion": plan_current,
        "billedSeconds": billed_seconds,
        "billedBaseSeconds": billed_base,
        "billedTicketSeconds": billed_ticket,
        "baseRemainingThisMonth": snapshot["baseRemainingThisMonth"],
        "ticketSecondsBalance": snapshot["ticketSecondsBalance"],
        "totalAvailableThisMonth": snapshot["totalAvailableThisMonth"],
        "baseDailyQuotaSeconds": snapshot["baseDailyQuotaSeconds"],
        "dailyRemainingSeconds": snapshot["dailyRemainingSeconds"],
        "actualSeconds": actual_seconds,
        "reservedSeconds": reserved_seconds,
    }

    if anomaly:
        logger.warning(
            "Ticket balance anomaly detected | %s",
            json.dumps(
                {
                    "uid": uid,
                    "jobId": job_id_value,
                    "ticketBalanceBefore": ticket_balance_before,
                    "billedTicketSeconds": billed_ticket,
                }
            ),
        )

    return response


def get_uid_from_request(request: Request) -> str:
    # 【セキュリティガード】本番環境ではDEBUG_AUTH_BYPASSを強制無効化
    if IS_PRODUCTION:
        debug_bypass = False
    else:
        debug_bypass = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if debug_bypass:
        logger.warning("DEBUG_AUTH_BYPASS is enabled - development only!")
        return "debug-user"

    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="auth_required")
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="auth_required")
    ensure_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Firebase token verification failed: {exc}")
        raise HTTPException(status_code=401, detail="invalid_auth") from exc
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="invalid_auth")
    return uid


def verify_admin_access(request: Request) -> None:
    """
    管理者アクセスを検証
    - 本番: OIDC/IAM認証（Cloud SchedulerからのService Account呼び出しを想定）
    - 開発: x-admin-tokenによる簡易認証
    """
    if IS_PRODUCTION:
        # 本番環境：Cloud Run の OIDC トークン検証
        # Cloud Scheduler が Service Account で呼び出す想定
        # allow-unauthenticated だが、IAMで制限する
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.error("Admin endpoint accessed without Bearer token in production")
            raise HTTPException(status_code=401, detail="unauthorized")

        # 簡易的なトークン検証（本格的にはFirebase Admin SDKやGoogle Auth Libraryを使用）
        # ここでは、Cloud Runのmetadataサービスを使った検証は省略し、
        # IAM設定で invoker ロールを制限することを前提とする
        # 必要に応じてトークン検証を追加
        logger.info("Admin access via OIDC/IAM")
    else:
        # 開発環境：x-admin-token による簡易認証
        expected = os.getenv("ADMIN_CLEANUP_TOKEN")
        if not expected:
            raise HTTPException(status_code=500, detail="admin_cleanup_not_configured")
        token = request.headers.get("x-admin-token", "")
        if token != expected:
            logger.warning("Invalid admin token attempt")
            raise HTTPException(status_code=403, detail="forbidden")


def maybe_delete_job_assets(job_data: dict) -> None:
    bucket_name = os.getenv("GCS_BUCKET") or os.getenv("GOOGLE_CLOUD_STORAGE_BUCKET")
    storage_path = job_data.get("storagePath")
    if not bucket_name or not storage_path:
        return
    try:
        client = get_storage_client()
        bucket = client.bucket(bucket_name)
        bucket.blob(storage_path).delete()
    except Exception:
        pass


def complete_job_transaction_simple(
    db,
    job_ref,
    uid: str,
    reported_seconds: int | None,
    current_jst: datetime,
    now_utc: datetime,
) -> dict:
    """Simplified transaction for DEBUG_AUTH_BYPASS mode"""
    return _complete_job_core(db, job_ref, uid, reported_seconds, current_jst, now_utc, transaction=None)


@firebase_firestore.transactional
def complete_job_transaction(
    transaction: firebase_firestore.Transaction,
    db: firebase_firestore.Client,
    job_ref: firebase_firestore.DocumentReference,
    uid: str,
    reported_seconds: int | None,
    current_jst: datetime,
    now_utc: datetime,
) -> dict:
    return _complete_job_core(db, job_ref, uid, reported_seconds, current_jst, now_utc, transaction=transaction)


app = FastAPI(title="Realtime Translator PWA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/downloads", StaticFiles(directory=DOWNLOAD_DIR), name="downloads")


@app.on_event("startup")
async def generate_static_assets() -> None:
    ensure_icon(STATIC_DIR / "icon-192.png", ICON_192_B64)
    ensure_icon(STATIC_DIR / "icon-512.png", ICON_512_B64)


async def post_openai(url: str, payload: dict, headers: dict | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers or {})
        if not response.is_success:
            # デバッグ用: エラー時のステータスとレスポンスボディをログ出力（秘匿情報マスク）
            logger.error(f"OpenAI API error: status={response.status_code}, body={mask_secrets(response.text)}")
        response.raise_for_status()
        return response.json()


audio_model_default = "gpt-4o-mini-transcribe"
realtime_model_default = os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview-2024-12-17")
translate_model_default = "gpt-4o-mini"
summarize_model_default = "gpt-4o-mini"


def extract_output_text(result: dict) -> str:
    if "output" in result and isinstance(result.get("output"), list):
        first = result["output"][0]
        content = first.get("content") if isinstance(first, dict) else None
        if content and isinstance(content, list) and content:
            text_item = content[0]
            if isinstance(text_item, dict):
                return text_item.get("text", "").strip()
    return (result.get("output_text") or result.get("content") or "").strip()


BASE_SESSION_INSTRUCTIONS = (
    "You are a real-time interpreter. "
    "Output only the translated text. No extra commentary. "
    "Preserve proper nouns, acronyms, and numbers."
)
GLOSSARY_MAX_LINES = 200


def parse_glossary_text(text: str | None) -> list[tuple[str, str]]:
    if not text:
        return []
    entries: list[tuple[str, str]] = []
    for line in text.splitlines():
        if len(entries) >= GLOSSARY_MAX_LINES:
            break
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.match(r"^(.+?)\s*(?:=>|=)\s*(.+)$", line)
        if not match:
            continue
        source = match.group(1).strip()
        target = match.group(2).strip()
        if source and target:
            entries.append((source, target))
    return entries


def build_session_instructions(glossary_entries: list[tuple[str, str]], output_lang: str | None) -> str:
    instructions = BASE_SESSION_INSTRUCTIONS
    if output_lang and output_lang != "auto":
        lang_names = {"ja": "Japanese", "en": "English", "zh": "Chinese"}
        lang_name = lang_names.get(output_lang, output_lang)
        instructions += f" Translate into {lang_name}."
    if glossary_entries:
        instructions += "\n\nGlossary (must-follow):"
        for source, target in glossary_entries:
            instructions += f"\n- {source} => {target}"
        instructions += "\n\nGlossary rules:"
        instructions += "\n- If a glossary entry matches, you MUST use the specified target term."
        instructions += "\n- Avoid partial-match mistakes; prefer whole-word matches when reasonable."
        instructions += "\n- Do not invent glossary entries."
    return instructions


def sanitize_session_for_log(session: dict) -> dict:
    if not isinstance(session, dict):
        return {}
    sanitized: dict = {}
    for key, value in session.items():
        if key == "instructions" and isinstance(value, str):
            sanitized[key] = f"<len={len(value)}>"
        else:
            sanitized[key] = value
    return sanitized


@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    index_file = STATIC_DIR / "index.html"
    return HTMLResponse(index_file.read_text(encoding="utf-8"))


@app.get("/sw.js", include_in_schema=False)
async def service_worker() -> FileResponse:
    return FileResponse(STATIC_DIR / "sw.js", media_type="application/javascript")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> FileResponse:
    return FileResponse(STATIC_DIR / "icon-192.png", media_type="image/png")


@app.post("/token")
async def create_token(
    request: Request,
    vad_silence: int | None = Form(None),
    glossary_text: str | None = Form(None, alias="glossaryText"),
    output_lang: str | None = Form(None, alias="outputLang"),
) -> JSONResponse:
    # 認証必須: Firebase ID トークンを検証
    uid = get_uid_from_request(request)
    logger.info(f"Token requested by uid: {uid}")

    # TODO: vad_silence, transcription, server_vad を最小疎通後に戻す
    # silence_ms = vad_silence if vad_silence is not None else 400

    # OpenAI docs: /v1/realtime/client_secrets with session wrapper
    # https://platform.openai.com/docs/guides/realtime-webrtc
    # 最小構成で疎通確認 - 追加オプションは疎通後に有効化
    glossary_entries = parse_glossary_text(glossary_text)
    instructions = build_session_instructions(glossary_entries, output_lang)

    payload = {
        "session": {
            "type": "realtime",
            "model": "gpt-4o-realtime-preview",
            "instructions": instructions,
            "audio": {
                "output": {
                    "voice": "alloy",
                }
            },
            # TODO: 疎通確認後に以下を有効化
            # "turn_detection": {
            #     "type": "server_vad",
            #     "silence_duration_ms": silence_ms,
            # },
            # "input_audio_transcription": {
            #     "model": audio_model_default,
            # },
        }
    }

    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    # payload の session 情報をログ出力
    session_info = payload.get("session", {})
    logger.info(
        f"Requesting ephemeral key | type={session_info.get('type')}, "
        f"model={session_info.get('model')}, voice={session_info.get('audio', {}).get('output', {}).get('voice')}, "
        f"glossary_entries={len(glossary_entries)}, instructions_len={len(instructions)}"
    )
    session_log = sanitize_session_for_log(session_info)

    try:
        data = await post_openai(
            "https://api.openai.com/v1/realtime/client_secrets",
            payload,
            headers,
        )
    except httpx.HTTPStatusError as exc:
        resp = exc.response
        status_code = resp.status_code if resp is not None else 502
        reason = resp.reason_phrase if resp is not None else "Error"
        body_text = resp.text if resp is not None else ""
        logger.error(
            "OpenAI client_secrets error: "
            f"status={status_code}, reason={reason}, body={mask_secrets(body_text)}, session={session_log}"
        )
        raise HTTPException(
            status_code=status_code,
            detail=f"OpenAI API error ({status_code} {reason})",
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "OpenAI request error: "
            f"{type(exc).__name__}: {exc} session={session_log}"
        )
        raise HTTPException(
            status_code=502,
            detail="OpenAI request error",
        )

    # /v1/realtime/client_secrets returns: { "value": "ek_...", "expires_at": ..., "session": {...} }
    raw_secret = data.get("value")

    if not isinstance(raw_secret, str) or not raw_secret.strip():
        logger.error(f"value missing in OpenAI response: {mask_secrets(str(data))}")
        raise HTTPException(status_code=502, detail="client_secret missing in OpenAI response")

    logger.info(f"Ephemeral key obtained successfully (prefix: {raw_secret[:10]}...)")
    # フロントが data.value を読む前提に合わせる
    return JSONResponse({"value": raw_secret})



@app.post("/api/v1/jobs/create")
async def create_job(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    now_utc = datetime.now(timezone.utc)
    job_id = uuid.uuid4().hex

    force_takeover = False
    raw_force_takeover = request.query_params.get("force_takeover")
    if raw_force_takeover is not None:
        force_takeover = parse_bool(raw_force_takeover)
    else:
        try:
            body = await request.json()
        except Exception:
            body = {}
        if isinstance(body, dict):
            raw_force_takeover = body.get("force_takeover")
            if raw_force_takeover is None:
                raw_force_takeover = body.get("forceTakeover")
            force_takeover = parse_bool(raw_force_takeover)

    use_simple = False
    if not IS_PRODUCTION:
        use_simple = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if use_simple:
        result = create_job_transaction_simple(
            db, uid, job_id, current_jst, now_utc, force_takeover=force_takeover
        )
    else:
        transaction = db.transaction(max_attempts=10)
        result = create_job_transaction(
            transaction, db, uid, job_id, current_jst, now_utc, force_takeover=force_takeover
        )

    log_payload = {
        "uid": uid,
        "jobId": job_id,
        "endpoint": "jobs.create",
        "plan": result.get("plan"),
        "reservedSeconds": result.get("reservedSeconds"),
        "reservedBaseSeconds": result.get("reservedBaseSeconds"),
        "reservedTicketSeconds": result.get("reservedTicketSeconds"),
        "totalAvailableThisMonth": result.get("totalAvailableThisMonth"),
    }
    logger.info(f"Job reservation | {json.dumps(log_payload)}")
    return JSONResponse(result)


@app.post("/api/v1/jobs/complete")
async def complete_job(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    body = await request.json()
    job_id = body.get("jobId")
    if not job_id:
        raise HTTPException(status_code=400, detail="jobId is required")
    audio_seconds = None
    if "audioSeconds" in body:
        try:
            audio_seconds = int(body.get("audioSeconds"))
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="audioSeconds must be an integer")
        if audio_seconds < 0:
            raise HTTPException(status_code=400, detail="audioSeconds must be >= 0")

    db = get_firestore_client()
    job_ref = db.collection("jobs").document(job_id)
    current_jst = now_jst()
    now_utc = datetime.now(timezone.utc)

    # 【セキュリティガード】本番環境では simplified transaction を使わない
    use_simple = False
    if not IS_PRODUCTION:
        use_simple = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if use_simple:
        result = complete_job_transaction_simple(db, job_ref, uid, audio_seconds, current_jst, now_utc)
    else:
        transaction = db.transaction(max_attempts=10)
        result = complete_job_transaction(
            transaction, db, job_ref, uid, audio_seconds, current_jst, now_utc
        )

    log_payload = {
        "uid": uid,
        "jobId": job_id,
        "endpoint": "jobs.complete",
        "status": result.get("status"),
        "billedSeconds": result.get("billedSeconds"),
        "billedBaseSeconds": result.get("billedBaseSeconds"),
        "billedTicketSeconds": result.get("billedTicketSeconds"),
    }
    logger.info(f"Job completed | {json.dumps(log_payload)}")
    return JSONResponse(result)


@app.get("/api/v1/usage/remaining")
async def get_remaining_usage(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    _, user_state, plan, plan_config = read_user_state(db, uid, current_jst)
    snapshot = build_quota_snapshot(user_state, plan_config)
    response = {
        "plan": plan,
        "quotaSeconds": snapshot["baseMonthlyQuotaSeconds"],
        "usedSeconds": snapshot["usedBaseSecondsThisMonth"],
        "remainingSeconds": snapshot["baseRemainingThisMonth"],
        "yyyymm": user_state.get("monthKey"),
        "baseMonthlyQuotaSeconds": snapshot["baseMonthlyQuotaSeconds"],
        "baseRemainingThisMonth": snapshot["baseRemainingThisMonth"],
        "ticketSecondsBalance": snapshot["ticketSecondsBalance"],
        "totalAvailableThisMonth": snapshot["totalAvailableThisMonth"],
        "baseDailyQuotaSeconds": snapshot["baseDailyQuotaSeconds"],
        "usedSecondsToday": snapshot["usedSecondsToday"],
        "dailyRemainingSeconds": snapshot["dailyRemainingSeconds"],
    }

    logger.info(
        f"Usage snapshot | {json.dumps({'uid': uid, 'plan': plan, 'baseRemaining': response['baseRemainingThisMonth'], 'tickets': response['ticketSecondsBalance']})}"
    )

    return JSONResponse(response)


@app.get("/api/v1/me")
async def get_me(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    _, user_state, plan, plan_config = read_user_state(db, uid, current_jst)
    snapshot = build_quota_snapshot(user_state, plan_config)

    # Calculate nextResetAt (first day of next month in JST, as UTC ISO8601)
    next_reset = next_month_start_utc(current_jst)

    # Determine blockedReason if user cannot start
    blocked_reason = None
    total_available = snapshot["totalAvailableThisMonth"]
    daily_remaining = snapshot["dailyRemainingSeconds"]
    if total_available <= 0:
        blocked_reason = "monthly_quota_exhausted"
    elif plan == "free" and daily_remaining is not None and daily_remaining <= 0:
        blocked_reason = "daily_limit_reached"

    response = {
        "plan": plan,
        "baseMonthlyQuotaSeconds": snapshot["baseMonthlyQuotaSeconds"],
        "usedBaseSecondsThisMonth": snapshot["usedBaseSecondsThisMonth"],
        "baseRemainingThisMonth": snapshot["baseRemainingThisMonth"],
        "ticketSecondsBalance": snapshot["ticketSecondsBalance"],
        "creditSeconds": snapshot["ticketSecondsBalance"],  # フロント互換性のため追加
        "totalAvailableThisMonth": snapshot["totalAvailableThisMonth"],
        "maxSessionSeconds": plan_config.get("maxSessionSeconds"),
        "activeJob": bool(user_state.get("activeJobId")),
        "monthKey": user_state.get("monthKey"),
        "dayKey": user_state.get("dayKey"),
        "nextResetAt": next_reset.isoformat(),
    }

    if blocked_reason:
        response["blockedReason"] = blocked_reason

    if snapshot["baseDailyQuotaSeconds"] is not None:
        response.update(
            {
                "baseDailyQuotaSeconds": snapshot["baseDailyQuotaSeconds"],
                "usedSecondsToday": snapshot["usedSecondsToday"],
                "dailyRemainingSeconds": snapshot["dailyRemainingSeconds"],
            }
        )

    logger.info(
        f"Account snapshot | {json.dumps({'uid': uid, 'plan': plan, 'totalAvailable': response['totalAvailableThisMonth'], 'ticketSecondsBalance': response['ticketSecondsBalance']})}"
    )

    return JSONResponse(response)


@app.post("/api/v1/test/create-expired-job")
async def create_expired_job(request: Request) -> JSONResponse:
    """DEBUG only: Create a job with past deleteAt for testing cleanup"""
    # 【セキュリティガード】本番環境では無効化
    if IS_PRODUCTION:
        raise HTTPException(status_code=404, detail="not_found")

    if os.getenv("DEBUG_AUTH_BYPASS") != "1":
        raise HTTPException(status_code=404, detail="not_found")

    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    yyyymm = month_key(current_jst)

    job_id = uuid.uuid4().hex
    delete_at = (current_jst - timedelta(days=1)).astimezone(timezone.utc)
    plan = "free"
    plan_config = resolve_plan_config(plan)
    now_utc = datetime.now(timezone.utc)
    job_data = {
        "uid": uid,
        "status": "completed",
        "plan": plan,
        "planAtStart": plan,
        "reservedSeconds": 0,
        "reservedBaseSeconds": 0,
        "reservedTicketSeconds": 0,
        "billedSeconds": 0,
        "billedBaseSeconds": 0,
        "billedTicketSeconds": 0,
        "maxSessionSeconds": plan_config["maxSessionSeconds"],
        "retentionDays": plan_config["retentionDays"],
        "monthKey": yyyymm,
        "dayKey": day_key(current_jst),
        "createdAt": now_utc,
        "startedAt": now_utc - timedelta(minutes=5),
        "completedAt": now_utc - timedelta(minutes=1),
        "endedAt": now_utc - timedelta(minutes=1),
        "deleteAt": delete_at,
    }
    db.collection("jobs").document(job_id).set(job_data)

    logger.info(f"Test expired job created: {job_id} | {json.dumps({'jobId': job_id})}")
    return JSONResponse({"jobId": job_id, "deleteAt": delete_at.isoformat()})


@app.post("/api/v1/admin/cleanup")
async def cleanup_jobs(request: Request, limit: int = 200) -> JSONResponse:
    """
    期限切れjobsを削除
    本番: Cloud SchedulerからOIDC認証で呼び出し
    開発: x-admin-tokenで認証
    """
    verify_admin_access(request)
    db = get_firestore_client()
    now_utc = datetime.now(timezone.utc)
    query = db.collection("jobs").where("deleteAt", "<", now_utc).limit(limit)

    deleted = 0
    errors = 0
    scanned = 0

    for doc in query.stream():
        scanned += 1
        try:
            job_data = doc.to_dict() or {}
            job_id = doc.id
            maybe_delete_job_assets(job_data)
            doc.reference.delete()
            deleted += 1
            logger.info(f"Deleted expired job: {job_id} | {json.dumps({'jobId': job_id, 'deleteAt': str(job_data.get('deleteAt'))})}")
        except Exception as e:
            errors += 1
            logger.error(f"Failed to delete job: {e} | {json.dumps({'error': str(e)})}")

    result = {"deleted": deleted, "scanned": scanned, "errors": errors}
    logger.info(f"Cleanup completed | {json.dumps(result)}")
    return JSONResponse(result)


@app.post("/api/v1/billing/stripe/checkout")
async def create_checkout_session(request: Request) -> JSONResponse:
    """Stripe Checkout Session 作成（Proプラン登録用）"""
    uid = get_uid_from_request(request)
    body = await request.json()
    success_url = body.get("successUrl", "https://example.com/success")
    cancel_url = body.get("cancelUrl", "https://example.com/cancel")

    secret_key = os.getenv("STRIPE_SECRET_KEY")
    price_id = os.getenv("STRIPE_PRO_PRICE_ID")
    if not secret_key or not price_id:
        raise HTTPException(status_code=500, detail="stripe_not_configured")

    stripe.api_key = secret_key

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            client_reference_id=uid,
            metadata={"uid": uid},
            subscription_data={"metadata": {"uid": uid}},
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=body.get("email"),
        )
        logger.info(f"Checkout session created for uid: {uid} | {json.dumps({'uid': uid, 'sessionId': session.id})}")
        return JSONResponse({"sessionId": session.id, "url": session.url})
    except Exception as e:
        logger.error(f"Stripe checkout session creation failed: {e} | {json.dumps({'uid': uid, 'error': str(e)})}")
        raise HTTPException(status_code=500, detail=f"checkout_failed: {str(e)}")


@app.get("/api/v1/company/profile")
async def get_company_profile(request: Request) -> JSONResponse:
    """会社情報を取得"""
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}
    company_profile = user_data.get("companyProfile", {})
    logger.info(f"[company_profile] GET | {json.dumps({'uid': uid})}")
    return JSONResponse({"companyProfile": company_profile})


def build_stripe_customer_payload(company_profile: dict) -> dict:
    """
    companyProfile から Stripe Customer.modify 用の payload を構築
    安全域のみ: name, address, metadata
    """
    payload = {}

    # name = companyName（あれば）
    company_name = company_profile.get("companyName", "").strip()
    if company_name:
        payload["name"] = company_name

    # address（line1, postal_code, country）
    address = {}
    addr_line1 = company_profile.get("address", "").strip()
    if addr_line1:
        address["line1"] = addr_line1
    postal_code = company_profile.get("postalCode", "").strip()
    if postal_code:
        address["postal_code"] = postal_code
    country = company_profile.get("country", "").strip()
    if country:
        address["country"] = country
    if address:
        payload["address"] = address

    # metadata に全フィールドを保存
    metadata = {
        "source": "company_profile_sync",
    }
    for key in ["companyName", "department", "position", "address", "postalCode", "country", "taxIdLabel", "taxIdValue"]:
        val = company_profile.get(key, "").strip()
        if val:
            metadata[key] = val[:500]  # Stripe metadata value limit
    payload["metadata"] = metadata

    return payload


def sync_company_profile_to_stripe(customer_id: str, company_profile: dict) -> dict:
    """
    companyProfile を Stripe Customer に同期（ベストエフォート）
    Returns: {"attempted": bool, "updated": bool, "skipped": bool, "reason": str|None, "error": str|None}
    """
    result = {
        "attempted": False,
        "updated": False,
        "skipped": False,
        "reason": None,
        "error": None,
    }

    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        result["skipped"] = True
        result["reason"] = "stripe_not_configured"
        logger.info(f"[stripe_sync] Skipped: STRIPE_SECRET_KEY not set")
        return result

    if not customer_id:
        result["skipped"] = True
        result["reason"] = "no_customer_id"
        logger.info(f"[stripe_sync] Skipped: no stripeCustomerId")
        return result

    result["attempted"] = True
    stripe.api_key = secret_key

    try:
        payload = build_stripe_customer_payload(company_profile)
        stripe.Customer.modify(customer_id, **payload)
        result["updated"] = True
        logger.info(f"[stripe_sync] Customer updated | {json.dumps({'customerId': customer_id, 'fields': list(payload.keys())})}")
    except Exception as e:
        result["error"] = str(e)
        logger.error(f"[stripe_sync] Customer update failed | {json.dumps({'customerId': customer_id, 'error': str(e)})}")

    return result


@app.post("/api/v1/company/profile")
async def save_company_profile(request: Request) -> JSONResponse:
    """会社情報を保存"""
    uid = get_uid_from_request(request)
    body = await request.json()
    company_profile = body.get("companyProfile", {})

    # 許可するフィールドのみ保存
    allowed_fields = ["companyName", "department", "position", "address", "postalCode", "country", "taxIdLabel", "taxIdValue"]
    sanitized = {k: v for k, v in company_profile.items() if k in allowed_fields and isinstance(v, str)}

    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)

    # Firestore に保存
    user_ref.set({
        "companyProfile": sanitized,
        "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
    }, merge=True)

    logger.info(f"[company_profile] POST | {json.dumps({'uid': uid, 'fields': list(sanitized.keys())})}")

    # Stripe Customer に同期（ベストエフォート）
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}
    customer_id = user_data.get("stripeCustomerId")

    stripe_sync = sync_company_profile_to_stripe(customer_id, sanitized)

    # Firestore に同期結果を保存（任意）
    sync_status = {
        "lastCompanyProfileSyncAt": firebase_firestore.SERVER_TIMESTAMP,
    }
    if stripe_sync["updated"]:
        sync_status["lastCompanyProfileSyncOk"] = True
        sync_status["lastCompanyProfileSyncError"] = None
    elif stripe_sync["error"]:
        sync_status["lastCompanyProfileSyncOk"] = False
        sync_status["lastCompanyProfileSyncError"] = stripe_sync["error"]
    elif stripe_sync["skipped"]:
        sync_status["lastCompanyProfileSyncOk"] = None
        sync_status["lastCompanyProfileSyncError"] = stripe_sync["reason"]

    user_ref.set({"stripeSync": sync_status}, merge=True)

    return JSONResponse({
        "ok": True,
        "companyProfile": sanitized,
        "stripeSync": stripe_sync,
    })


@app.get("/api/v1/billing/status")
async def get_billing_status(request: Request) -> JSONResponse:
    """サブスクリプション状態を取得"""
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}

    plan = normalize_plan(user_data.get("plan"))
    subscription_status = user_data.get("subscriptionStatus", "free")
    cancel_at_period_end = user_data.get("cancelAtPeriodEnd", False)
    current_period_end = user_data.get("currentPeriodEnd")

    # currentPeriodEnd を ISO 文字列に変換
    current_period_end_iso = None
    current_period_end_unix = None
    if current_period_end:
        if hasattr(current_period_end, "isoformat"):
            current_period_end_iso = current_period_end.isoformat()
            current_period_end_unix = int(current_period_end.timestamp())
        elif isinstance(current_period_end, (int, float)):
            current_period_end_unix = int(current_period_end)
            current_period_end_iso = datetime.fromtimestamp(current_period_end, tz=timezone.utc).isoformat()

    response = {
        "plan": plan,
        "subscriptionStatus": subscription_status,
        "cancelAtPeriodEnd": cancel_at_period_end,
        "currentPeriodEnd": current_period_end_iso,
        "currentPeriodEndUnix": current_period_end_unix,
        "isPro": plan == "pro",
        "isPastDue": subscription_status == "past_due",
        "isCanceling": cancel_at_period_end and plan == "pro",
    }

    logger.info(f"[billing_status] GET | {json.dumps({'uid': uid, 'plan': plan, 'status': subscription_status})}")
    return JSONResponse(response)


@app.post("/api/v1/billing/stripe/portal")
async def create_portal_session(request: Request) -> JSONResponse:
    """Stripe Customer Portal Session 作成（サブスク管理用）"""
    uid = get_uid_from_request(request)
    body = await request.json()
    return_url = body.get("returnUrl", "https://example.com")

    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="stripe_not_configured")

    stripe.api_key = secret_key

    # uidからStripe Customer IDを取得
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}
    customer_id = user_data.get("stripeCustomerId")

    if not customer_id:
        logger.error(f"[stripe_portal] No Stripe customer ID for uid: {uid} | {json.dumps({'uid': uid})}")
        raise HTTPException(status_code=400, detail="no_customer_id")

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        logger.info(f"[stripe_portal] Portal session created for uid: {uid} | {json.dumps({'uid': uid, 'customerId': customer_id})}")
        print(f"[stripe_portal] Portal session created for uid: {uid} | customerId={customer_id}")
        return JSONResponse({"url": session.url})
    except Exception as e:
        logger.error(f"[stripe_portal] Stripe portal session creation failed: {e} | {json.dumps({'uid': uid, 'error': str(e)})}")
        raise HTTPException(status_code=500, detail=f"portal_failed: {str(e)}")


@app.post("/api/v1/billing/stripe/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """
    Stripe Webhook ハンドラー
    対応イベント:
    - checkout.session.completed (subscription or ticket_purchase)
    - customer.subscription.created/updated/deleted
    - invoice.paid
    - invoice.payment_failed
    """
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=500, detail="stripe_webhook_not_configured")

    sig_header = request.headers.get("Stripe-Signature")
    if not sig_header:
        logger.warning("Stripe webhook called without Stripe-Signature header")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.SignatureVerificationError:
        logger.error("Stripe webhook signature verification failed")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except ValueError:
        logger.error("Stripe webhook invalid payload (JSON parse error)")
        raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("type", "unknown")
    event_id = event.get("id", "unknown")

    # stdout に出力（Cloud Logging で確認用）
    print(f"[stripe_webhook] received event type={event_type} id={event_id}")

    logger.info(f"Stripe webhook received | {json.dumps({'eventType': event_type, 'eventId': event_id})}")

    db = get_firestore_client()

    # Checkout完了イベント（購入直後のuid紐付け）
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session.get("id")
        client_ref_id = session.get("client_reference_id")
        metadata = session.get("metadata") or {}
        metadata_uid = metadata.get("uid")
        uid = client_ref_id or metadata_uid
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        purchase_type = metadata.get("type")  # "ticket_purchase" or None (subscription)

        # 抽出した全フィールドをログ出力（デバッグ用）
        logger.info(f"[stripe_webhook] checkout.session.completed extracted | {json.dumps({'sessionId': session_id, 'clientReferenceId': client_ref_id, 'metadataUid': metadata_uid, 'uid': uid, 'customerId': customer_id, 'subscriptionId': subscription_id, 'type': purchase_type})}")
        print(f"[stripe_webhook] checkout.session.completed | sessionId={session_id} uid={uid} type={purchase_type}")

        if not uid:
            logger.warning(f"[stripe_webhook] checkout.session.completed without uid | {json.dumps({'sessionId': session_id, 'customerId': customer_id, 'clientReferenceId': client_ref_id, 'metadataUid': metadata_uid})}")
            return JSONResponse({"received": True, "warning": "uid_not_found"})

        # チケット購入の場合: ticketSecondsBalance を加算
        if purchase_type == "ticket_purchase":
            pack_id = metadata.get("packId")
            minutes_str = metadata.get("minutes")
            try:
                minutes = int(minutes_str) if minutes_str else 0
            except (ValueError, TypeError):
                minutes = 0

            if minutes <= 0:
                logger.error(f"[stripe_webhook] ticket_purchase invalid_minutes | {json.dumps({'sessionId': session_id, 'uid': uid, 'minutes': minutes_str})}")
                return JSONResponse({"received": True, "error": "invalid_minutes"}, status_code=400)

            seconds_to_add = minutes * 60
            user_ref = db.collection("users").document(uid)
            purchase_ref = user_ref.collection("purchases").document(session_id)

            # トランザクション内で冪等性チェック + 加算を行う
            @firebase_firestore.transactional
            def add_ticket_balance_idempotent(transaction, user_ref, purchase_ref, seconds_to_add, session_id, pack_id, minutes):
                # 1. 既処理チェック（トランザクション内で読み取り）
                purchase_snap = purchase_ref.get(transaction=transaction)
                if purchase_snap.exists:
                    # 既に処理済み - 何もせず None を返す
                    return None

                # 2. ユーザー残高を読み取り
                user_snap = user_ref.get(transaction=transaction)
                user_data = user_snap.to_dict() if user_snap.exists else {}
                current_balance = safe_int(user_data.get("ticketSecondsBalance"), 0)
                new_balance = current_balance + seconds_to_add

                # 3. ユーザー残高を更新
                transaction.set(user_ref, {
                    "ticketSecondsBalance": new_balance,
                    "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
                }, merge=True)

                # 4. 購入履歴を記録（冪等性キー）
                transaction.set(purchase_ref, {
                    "sessionId": session_id,
                    "packId": pack_id,
                    "minutes": minutes,
                    "secondsAdded": seconds_to_add,
                    "balanceBefore": current_balance,
                    "balanceAfter": new_balance,
                    "createdAt": firebase_firestore.SERVER_TIMESTAMP,
                })

                return {"balanceBefore": current_balance, "balanceAfter": new_balance}

            try:
                transaction = db.transaction()
                result = add_ticket_balance_idempotent(transaction, user_ref, purchase_ref, seconds_to_add, session_id, pack_id, minutes)

                if result is None:
                    # 既処理（トランザクション内で検出）
                    logger.warning(f"[stripe_webhook] ticket_purchase already_processed | {json.dumps({'sessionId': session_id, 'uid': uid})}")
                    return JSONResponse({"received": True, "warning": "already_processed"})

                # 成功
                logger.info(f"[stripe_webhook] ticket_purchase success | {json.dumps({'sessionId': session_id, 'uid': uid, 'packId': pack_id, 'minutes': minutes, 'secondsAdded': seconds_to_add, 'balanceBefore': result['balanceBefore'], 'balanceAfter': result['balanceAfter']})}")
                print(f"[stripe_webhook] ticket_purchase success | uid={uid} packId={pack_id} minutes={minutes} balanceBefore={result['balanceBefore']} balanceAfter={result['balanceAfter']}")
                return JSONResponse({"received": True, "ticketSecondsAdded": seconds_to_add})
            except Exception as e:
                logger.exception(f"[stripe_webhook] ticket_purchase FAILED | {json.dumps({'sessionId': session_id, 'uid': uid, 'error': str(e)})}")
                return JSONResponse({"received": True, "error": "ticket_update_failed"}, status_code=500)

        # サブスクリプション購入の場合: 既存処理
        user_updates = {
            "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
        }
        if customer_id:
            user_updates["stripeCustomerId"] = customer_id
        if subscription_id:
            user_updates["stripeSubscriptionId"] = subscription_id

        try:
            db.collection("users").document(uid).set(user_updates, merge=True)
            logger.info(f"[stripe_webhook] checkout.session.completed Firestore updated | {json.dumps({'uid': uid, 'customerId': customer_id, 'subscriptionId': subscription_id, 'fields': list(user_updates.keys())})}")
        except Exception as e:
            logger.exception(f"[stripe_webhook] checkout.session.completed Firestore set FAILED | {json.dumps({'uid': uid, 'customerId': customer_id, 'subscriptionId': subscription_id, 'error': str(e)})}")
            return JSONResponse({"received": True, "error": "firestore_update_failed"}, status_code=500)

        return JSONResponse({"received": True})

    # サブスクリプション関連イベント
    if event_type in ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]:
        subscription = event["data"]["object"]
        metadata = subscription.get("metadata") or {}
        uid = metadata.get("uid")
        customer_id = subscription.get("customer")

        if not uid:
            logger.warning(f"Subscription event without uid metadata | {json.dumps({'eventType': event_type, 'subscriptionId': subscription.get('id')})}")
            # customer_idからuidを逆引きする試み
            if customer_id:
                users_query = db.collection("users").where("stripeCustomerId", "==", customer_id).limit(1)
                for user_doc in users_query.stream():
                    uid = user_doc.id
                    break

        if not uid:
            logger.error(f"Cannot determine uid from subscription event | {json.dumps({'eventType': event_type})}")
            return JSONResponse({"received": True, "warning": "uid_not_found"})

        status = subscription.get("status", "")
        current_period_end = subscription.get("current_period_end")
        cancel_at_period_end = subscription.get("cancel_at_period_end", False)

        # customer.subscription.deleted の場合は明示的に free に戻す
        if event_type == "customer.subscription.deleted":
            plan = "free"
            status = "canceled"
            cancel_at_period_end = False
            logger.info(f"[stripe_webhook] Subscription deleted, resetting to free | {json.dumps({'uid': uid, 'subscriptionId': subscription.get('id')})}")
        # ステータスに応じてプラン設定
        # active または trialing の場合は pro、それ以外は free
        elif status in ("active", "trialing"):
            plan = "pro"
        else:
            plan = "free"

        plan_config = resolve_plan_config(plan)

        user_updates = {
            "plan": plan,
            "quotaSeconds": plan_config["quotaSeconds"],
            "retentionDays": plan_config["retentionDays"],
            "subscriptionStatus": status,
            "cancelAtPeriodEnd": cancel_at_period_end,
            "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
        }

        if customer_id:
            user_updates["stripeCustomerId"] = customer_id
        if current_period_end:
            user_updates["currentPeriodEnd"] = datetime.fromtimestamp(current_period_end, tz=timezone.utc)

        db.collection("users").document(uid).set(user_updates, merge=True)
        logger.info(f"[stripe_webhook] User plan updated from subscription event | {json.dumps({'uid': uid, 'plan': plan, 'status': status, 'cancelAtPeriodEnd': cancel_at_period_end})}")
        print(f"[stripe_webhook] User plan updated | uid={uid} plan={plan} status={status} cancelAtPeriodEnd={cancel_at_period_end}")

    # 支払い成功
    elif event_type == "invoice.paid":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")
        subscription_id = invoice.get("subscription")

        if customer_id:
            # customer_idからuidを取得
            users_query = db.collection("users").where("stripeCustomerId", "==", customer_id).limit(1)
            for user_doc in users_query.stream():
                uid = user_doc.id
                logger.info(f"[stripe_webhook] Invoice paid for uid: {uid} | {json.dumps({'uid': uid, 'invoiceId': invoice.get('id')})}")
                print(f"[stripe_webhook] Invoice paid | uid={uid} invoiceId={invoice.get('id')}")
                # 必要に応じて追加処理（通知等）
                break

    # 支払い失敗
    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice.get("customer")

        if customer_id:
            users_query = db.collection("users").where("stripeCustomerId", "==", customer_id).limit(1)
            for user_doc in users_query.stream():
                uid = user_doc.id
                # subscriptionStatus を past_due に更新（plan は即 free にしない方針）
                db.collection("users").document(uid).set({
                    "subscriptionStatus": "past_due",
                    "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
                }, merge=True)
                logger.warning(f"[stripe_webhook] Invoice payment failed for uid: {uid} | {json.dumps({'uid': uid, 'invoiceId': invoice.get('id')})}")
                print(f"[stripe_webhook] Invoice payment failed | uid={uid} invoiceId={invoice.get('id')} subscriptionStatus=past_due")
                break

    return JSONResponse({"received": True})


# ========== Ticket Purchase API ==========
# Allowed ticket minutes (UI options)
ALLOWED_TICKET_MINUTES = [120, 240, 300, 360, 1200, 1800, 3000]

# Ticket pack definitions (packId -> minutes, JPY price)
# Price ID is resolved from STRIPE_TICKET_PRICE_MAP_JSON or price_T{minutes} env
TICKET_PACKS = {
    "t120": {"minutes": 120, "price_jpy": 1440},
    "t240": {"minutes": 240, "price_jpy": 2440},
    "t300": {"minutes": 300, "price_jpy": 2940},
    "t360": {"minutes": 360, "price_jpy": 3240},
    "t1200": {"minutes": 1200, "price_jpy": 9600},
    "t1800": {"minutes": 1800, "price_jpy": 12600},
    "t3000": {"minutes": 3000, "price_jpy": 21000},
}

# Cache for parsed JSON map
_ticket_price_map_cache: dict | None = None


def _get_ticket_price_map() -> dict:
    """Parse STRIPE_TICKET_PRICE_MAP_JSON and cache the result."""
    global _ticket_price_map_cache
    if _ticket_price_map_cache is not None:
        return _ticket_price_map_cache

    json_str = os.getenv("STRIPE_TICKET_PRICE_MAP_JSON")
    if json_str:
        try:
            data = json.loads(json_str)
            _ticket_price_map_cache = data.get("packs", {})
            logger.info(f"Loaded STRIPE_TICKET_PRICE_MAP_JSON with {len(_ticket_price_map_cache)} packs")
            return _ticket_price_map_cache
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse STRIPE_TICKET_PRICE_MAP_JSON: {e}")

    _ticket_price_map_cache = {}
    return _ticket_price_map_cache


def get_ticket_price_id(pack_id: str, minutes: int) -> str | None:
    """
    Get Stripe Price ID for ticket pack.
    Priority (canonical first):
    1. price_T{minutes} env var (canonical - highest priority)
    2. STRIPE_TICKET_PRICE_MAP_JSON (JSON map fallback)
    3. STRIPE_TICKET_{minutes}_PRICE_ID (legacy fallback)
    """
    canonical_key = f"price_T{minutes}"

    # 1. Canonical env var: price_T{minutes} (highest priority)
    price_id = os.getenv(canonical_key)
    if price_id:
        return price_id

    # 2. Fallback: STRIPE_TICKET_PRICE_MAP_JSON
    price_map = _get_ticket_price_map()
    if pack_id in price_map:
        price_id = price_map[pack_id].get("priceId")
        if price_id:
            logger.warning(
                f"Using STRIPE_TICKET_PRICE_MAP_JSON for {pack_id}, "
                f"please migrate to env var {canonical_key}"
            )
            return price_id

    # 3. Legacy fallback: STRIPE_TICKET_{minutes}_PRICE_ID
    legacy_key = f"STRIPE_TICKET_{minutes}_PRICE_ID"
    price_id = os.getenv(legacy_key)
    if price_id:
        logger.warning(f"Using legacy env var {legacy_key}, please migrate to {canonical_key}")
        return price_id

    return None


@app.post("/api/v1/billing/stripe/tickets/checkout")
async def create_ticket_checkout_session(request: Request) -> JSONResponse:
    """Stripe Checkout Session for ticket purchase (one-time payment)"""
    uid = get_uid_from_request(request)
    body = await request.json()
    pack_id = body.get("packId")
    success_url = body.get("successUrl", "https://example.com/success")
    cancel_url = body.get("cancelUrl", "https://example.com/cancel")

    if pack_id not in TICKET_PACKS:
        raise HTTPException(status_code=400, detail="invalid_pack_id")

    pack = TICKET_PACKS[pack_id]
    minutes = pack["minutes"]

    # Validate minutes is in allowed list
    if minutes not in ALLOWED_TICKET_MINUTES:
        logger.error(f"Invalid ticket minutes: {minutes} (allowed: {ALLOWED_TICKET_MINUTES})")
        raise HTTPException(status_code=400, detail="invalid_ticket_minutes")

    # Check if user is Pro (only Pro users can buy tickets)
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}
    user_plan = user_data.get("plan", "free")

    if user_plan != "pro":
        raise HTTPException(status_code=403, detail="pro_required")

    # Get Price ID from JSON map or env var
    price_id = get_ticket_price_id(pack_id, minutes)
    if not price_id:
        env_key = f"price_T{minutes}"
        logger.error(f"Ticket price ID not configured | pack_id={pack_id} env_key={env_key}")
        raise HTTPException(
            status_code=500,
            detail=f"ticket_price_not_configured: {pack_id} (env: {env_key})"
        )

    secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="stripe_not_configured")

    stripe.api_key = secret_key

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            client_reference_id=uid,
            metadata={
                "uid": uid,
                "packId": pack_id,
                "minutes": pack["minutes"],
                "type": "ticket_purchase",
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )
        logger.info(f"Ticket checkout session created | uid={uid} packId={pack_id} sessionId={session.id}")
        return JSONResponse({"sessionId": session.id, "url": session.url})
    except Exception as e:
        logger.error(f"Ticket checkout session creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"checkout_failed: {str(e)}")


# ========== Dictionary API ==========
DICTIONARY_LIMIT_FREE = 10
DICTIONARY_LIMIT_PRO = 1000


def get_user_dictionary_limit(uid: str) -> int:
    """Get dictionary limit based on user plan"""
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    user_snap = user_ref.get()
    user_data = user_snap.to_dict() if user_snap.exists else {}
    plan = user_data.get("plan", "free")
    return DICTIONARY_LIMIT_PRO if plan == "pro" else DICTIONARY_LIMIT_FREE


@app.get("/api/v1/dictionary")
async def get_dictionary(request: Request, limit: int = 100, cursor: str = None) -> JSONResponse:
    """Get user's dictionary entries with pagination"""
    uid = get_uid_from_request(request)
    db = get_firestore_client()

    dict_ref = db.collection("users").document(uid).collection("dictionary")
    query = dict_ref.order_by("createdAt", direction=firebase_firestore.Query.DESCENDING).limit(limit + 1)

    if cursor:
        # Decode cursor (base64 encoded document ID)
        try:
            cursor_doc_id = base64.b64decode(cursor).decode("utf-8")
            cursor_doc = dict_ref.document(cursor_doc_id).get()
            if cursor_doc.exists:
                query = query.start_after(cursor_doc)
        except Exception:
            pass  # Invalid cursor, ignore

    docs = list(query.stream())
    has_more = len(docs) > limit
    if has_more:
        docs = docs[:limit]

    items = []
    for doc in docs:
        data = doc.to_dict()
        items.append({
            "id": doc.id,
            "source": data.get("source", ""),
            "target": data.get("target", ""),
            "note": data.get("note", ""),
            "createdAt": data.get("createdAt").isoformat() if data.get("createdAt") else None,
        })

    next_cursor = None
    if has_more and docs:
        next_cursor = base64.b64encode(docs[-1].id.encode("utf-8")).decode("utf-8")

    user_limit = get_user_dictionary_limit(uid)
    total_count = len(list(dict_ref.stream()))

    return JSONResponse({
        "items": items,
        "nextCursor": next_cursor,
        "limit": user_limit,
        "count": total_count,
    })


@app.post("/api/v1/dictionary/entry")
async def add_dictionary_entry(request: Request) -> JSONResponse:
    """Add a new dictionary entry"""
    uid = get_uid_from_request(request)
    body = await request.json()
    source = (body.get("source") or "").strip()
    target = (body.get("target") or "").strip()
    note = (body.get("note") or "").strip()

    if not source or not target:
        raise HTTPException(status_code=400, detail={"reason": "source and target are required"})

    db = get_firestore_client()
    dict_ref = db.collection("users").document(uid).collection("dictionary")

    # Check limit
    user_limit = get_user_dictionary_limit(uid)
    current_count = len(list(dict_ref.stream()))
    if current_count >= user_limit:
        raise HTTPException(status_code=400, detail={"reason": f"Dictionary limit reached ({user_limit})"})

    # Add entry
    new_entry = {
        "source": source,
        "target": target,
        "note": note,
        "createdAt": firebase_firestore.SERVER_TIMESTAMP,
    }
    doc_ref = dict_ref.add(new_entry)
    logger.info(f"Dictionary entry added | uid={uid} id={doc_ref[1].id}")

    return JSONResponse({"id": doc_ref[1].id, "count": current_count + 1, "limit": user_limit})


@app.put("/api/v1/dictionary/entry/{entry_id}")
async def update_dictionary_entry(request: Request, entry_id: str) -> JSONResponse:
    """Update a dictionary entry"""
    uid = get_uid_from_request(request)
    body = await request.json()
    source = (body.get("source") or "").strip()
    target = (body.get("target") or "").strip()
    note = (body.get("note") or "").strip()

    if not source or not target:
        raise HTTPException(status_code=400, detail={"reason": "source and target are required"})

    db = get_firestore_client()
    entry_ref = db.collection("users").document(uid).collection("dictionary").document(entry_id)
    entry_snap = entry_ref.get()

    if not entry_snap.exists:
        raise HTTPException(status_code=404, detail={"reason": "Entry not found"})

    entry_ref.update({
        "source": source,
        "target": target,
        "note": note,
        "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
    })
    logger.info(f"Dictionary entry updated | uid={uid} id={entry_id}")

    return JSONResponse({"id": entry_id, "updated": True})


@app.delete("/api/v1/dictionary/entry/{entry_id}")
async def delete_dictionary_entry(request: Request, entry_id: str) -> JSONResponse:
    """Delete a dictionary entry"""
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    entry_ref = db.collection("users").document(uid).collection("dictionary").document(entry_id)
    entry_snap = entry_ref.get()

    if not entry_snap.exists:
        raise HTTPException(status_code=404, detail={"reason": "Entry not found"})

    entry_ref.delete()
    logger.info(f"Dictionary entry deleted | uid={uid} id={entry_id}")

    user_limit = get_user_dictionary_limit(uid)
    dict_ref = db.collection("users").document(uid).collection("dictionary")
    current_count = len(list(dict_ref.stream()))

    return JSONResponse({"deleted": True, "count": current_count, "limit": user_limit})


@app.get("/api/v1/dictionary/template.csv")
async def get_dictionary_template(request: Request) -> JSONResponse:
    """Get CSV template for dictionary upload"""
    get_uid_from_request(request)  # Require auth
    csv_content = "source,target,note\n半導体,semiconductor,電子部品\n人工知能,AI,artificial intelligence"
    return JSONResponse({"csv": csv_content, "filename": "dictionary_template.csv"})


@app.post("/api/v1/dictionary/upload")
async def upload_dictionary_csv(request: Request) -> JSONResponse:
    """Upload dictionary entries from CSV"""
    uid = get_uid_from_request(request)
    body = await request.json()
    csv_content = body.get("csv", "")

    if not csv_content:
        raise HTTPException(status_code=400, detail={"reason": "CSV content is required"})

    db = get_firestore_client()
    dict_ref = db.collection("users").document(uid).collection("dictionary")
    user_limit = get_user_dictionary_limit(uid)
    current_count = len(list(dict_ref.stream()))

    lines = csv_content.strip().split("\n")
    if len(lines) < 2:
        raise HTTPException(status_code=400, detail={"reason": "CSV must have header and at least one data row"})

    # Skip header
    added = 0
    skipped = 0
    for line in lines[1:]:
        if current_count + added >= user_limit:
            skipped += 1
            continue

        parts = line.split(",")
        if len(parts) < 2:
            skipped += 1
            continue

        source = parts[0].strip()
        target = parts[1].strip()
        note = parts[2].strip() if len(parts) > 2 else ""

        if not source or not target:
            skipped += 1
            continue

        dict_ref.add({
            "source": source,
            "target": target,
            "note": note,
            "createdAt": firebase_firestore.SERVER_TIMESTAMP,
        })
        added += 1

    logger.info(f"Dictionary CSV uploaded | uid={uid} added={added} skipped={skipped}")
    return JSONResponse({
        "added": added,
        "skipped": skipped,
        "count": current_count + added,
        "limit": user_limit,
    })


# Language code to display name mapping for translation prompts
LANG_NAMES = {
    "ja": "Japanese",
    "en": "English",
    "zh": "Simplified Chinese",
}

VALID_INPUT_LANGS = {"auto", "ja", "en", "zh"}
VALID_OUTPUT_LANGS = {"ja", "en", "zh"}


def normalize_input_lang(lang: str | None) -> str:
    if lang and lang in VALID_INPUT_LANGS:
        return lang
    return "auto"


def normalize_output_lang(lang: str | None) -> str:
    if lang and lang in VALID_OUTPUT_LANGS:
        return lang
    return "ja"


@app.post("/translate")
async def translate_text(
    request: Request,
    text: str = Form(...),
    input_lang: str = Form("auto"),
    output_lang: str = Form("ja"),
) -> JSONResponse:
    # 認証必須: Firebase ID トークンを検証
    get_uid_from_request(request)

    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    # Normalize and validate language codes
    input_lang = normalize_input_lang(input_lang)
    output_lang = normalize_output_lang(output_lang)
    target_lang_name = LANG_NAMES.get(output_lang, "Japanese")

    # Build translation system prompt
    system_prompt = f"Translate the user's text into natural {target_lang_name}. Output the translation only, nothing else."

    payload = {
        "model": translate_model_default,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
    }

    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    result = await post_openai("https://api.openai.com/v1/responses", payload, headers)
    translated = extract_output_text(result)
    return JSONResponse({"translation": translated})



# Summarize section headers by language
SUMMARIZE_HEADERS = {
    "ja": {"summary": "要約", "key_points": "重要ポイント", "actions": "次のアクション"},
    "en": {"summary": "Summary", "key_points": "Key Points", "actions": "Next Actions"},
    "zh": {"summary": "摘要", "key_points": "要点", "actions": "下一步行动"},
}


def build_glossary_instructions_for_summary(glossary_text: str | None) -> str:
    """Build glossary instructions for summarize prompt (not for Realtime)."""
    entries = parse_glossary_text(glossary_text)
    if not entries:
        return ""
    lines = [f"{src}→{dst}" for src, dst in entries]
    return f"\n\n用語は必ず次の表記に統一してください：{', '.join(lines)}。該当語が出たら置換して要約に反映すること。"


SUMMARY_PROMPT_MAX_LENGTH = 2000


@app.post("/summarize")
async def summarize(
    request: Request,
    text: str = Form(...),
    output_lang: str = Form("ja"),
    glossary_text: str = Form(""),
    summary_prompt: str = Form(""),
) -> JSONResponse:
    # 認証必須: Firebase ID トークンを検証
    get_uid_from_request(request)

    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    # Normalize output language
    output_lang = normalize_output_lang(output_lang)
    headers_i18n = SUMMARIZE_HEADERS.get(output_lang, SUMMARIZE_HEADERS["ja"])
    target_lang_name = LANG_NAMES.get(output_lang, "Japanese")

    # Build glossary instructions (only for summarize, not Realtime)
    glossary_inst = build_glossary_instructions_for_summary(glossary_text)

    # Build custom summary prompt (user-provided, optional)
    custom_inst = ""
    if summary_prompt:
        # Sanitize: trim and enforce max length
        sanitized = summary_prompt.strip()[:SUMMARY_PROMPT_MAX_LENGTH]
        if sanitized:
            custom_inst = f"\n\n追加の指示: {sanitized}"

    system_prompt = (
        f"You are a meeting summarizer. Produce concise Markdown in {target_lang_name} with three sections: "
        f"1) {headers_i18n['summary']} 2) {headers_i18n['key_points']} (bullets) 3) {headers_i18n['actions']} (bullets)."
        f"{glossary_inst}{custom_inst}"
    )
    # Use same Responses API format as /translate (input array with roles, no top-level "system")
    payload = {
        "model": summarize_model_default,
        "input": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
    }
    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    result = await post_openai("https://api.openai.com/v1/responses", payload, headers)
    summary = extract_output_text(result)
    return JSONResponse({"summary": summary})


async def run_ffmpeg(input_path: Path, output_path: Path) -> None:
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-vn",
        "-acodec",
        "aac",
        str(output_path),
    ]
    process = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    if process.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {stderr.decode()}")


@app.post("/audio_m4a")
async def convert_audio(request: Request, file: UploadFile = File(...)) -> JSONResponse:
    # 認証必須: Firebase ID トークンを検証
    get_uid_from_request(request)

    suffix = Path(file.filename).suffix or ".webm"
    token = uuid.uuid4().hex
    input_path = DOWNLOAD_DIR / f"upload-{token}{suffix}"
    output_path = DOWNLOAD_DIR / f"converted-{token}.m4a"

    content = await file.read()
    input_path.write_bytes(content)

    try:
        await run_ffmpeg(input_path, output_path)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if input_path.exists():
            input_path.unlink()

    download_url = f"/downloads/{output_path.name}"
    return JSONResponse({"url": download_url})


# NOTE: Cloud Run reserves paths ending with 'z' (e.g., /healthz).
# Using /health instead to avoid 404 from Cloud Run infrastructure.
@app.get("/health")
async def healthcheck() -> JSONResponse:
    return JSONResponse(
        {
            "ok": True,
            "service": SERVICE_NAME,
            "version": APP_VERSION,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.exception_handler(httpx.HTTPStatusError)
async def httpx_error_handler(_: Request, exc: httpx.HTTPStatusError) -> JSONResponse:
    message = exc.response.text
    return JSONResponse(
        {"detail": f"OpenAI API error: {message}"}, status_code=exc.response.status_code
    )


@app.exception_handler(httpx.RequestError)
async def httpx_request_error(_: Request, exc: httpx.RequestError) -> JSONResponse:
    return JSONResponse({"detail": f"Network error: {exc}"}, status_code=502)


@app.get("/downloads/{filename}")
async def download_file(filename: str) -> FileResponse:
    try:
        path = (DOWNLOAD_DIR / filename).resolve()
    except OSError:
        raise HTTPException(status_code=400, detail="invalid filename")

    download_root = DOWNLOAD_DIR.resolve()
    if download_root not in path.parents and path != download_root:
        raise HTTPException(status_code=400, detail="invalid filename")

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="file not found")

    return FileResponse(path, filename=path.name)
