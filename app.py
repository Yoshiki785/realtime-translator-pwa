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
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "extra": %(extra)s}'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# 環境判定（本番ではセキュリティガード有効）
ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"

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
    "free": {"quotaSeconds": 1800, "retentionDays": 7},
    "pro": {"quotaSeconds": 7200, "retentionDays": 30},
}

FINAL_JOB_STATUSES = {"succeeded", "failed", "stopped_quota"}

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
            logger.warning("Using MockFirestoreClient - development only!", extra="{}")
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


def usage_doc_id(uid: str, yyyymm: str) -> str:
    return f"{uid}_{yyyymm}"


def resolve_plan_config(plan: str) -> dict:
    if plan not in PLANS:
        plan = "free"
    return PLANS[plan]


def ensure_user_profile(uid: str) -> dict:
    db = get_firestore_client()
    user_ref = db.collection("users").document(uid)
    snap = user_ref.get()
    data = snap.to_dict() if snap.exists else {}
    plan = data.get("plan", "free")
    if plan not in PLANS:
        plan = "free"
    plan_config = PLANS[plan]
    quota_seconds = int(data.get("quotaSeconds", plan_config["quotaSeconds"]))
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


def get_uid_from_request(request: Request) -> str:
    # 【セキュリティガード】本番環境ではDEBUG_AUTH_BYPASSを強制無効化
    if IS_PRODUCTION:
        debug_bypass = False
    else:
        debug_bypass = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if debug_bypass:
        logger.warning("DEBUG_AUTH_BYPASS is enabled - development only!", extra="{}")
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
        logger.error(f"Firebase token verification failed: {exc}", extra="{}")
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
            logger.error("Admin endpoint accessed without Bearer token in production", extra="{}")
            raise HTTPException(status_code=401, detail="unauthorized")

        # 簡易的なトークン検証（本格的にはFirebase Admin SDKやGoogle Auth Libraryを使用）
        # ここでは、Cloud Runのmetadataサービスを使った検証は省略し、
        # IAM設定で invoker ロールを制限することを前提とする
        # 必要に応じてトークン検証を追加
        logger.info("Admin access via OIDC/IAM", extra="{}")
    else:
        # 開発環境：x-admin-token による簡易認証
        expected = os.getenv("ADMIN_CLEANUP_TOKEN")
        if not expected:
            raise HTTPException(status_code=500, detail="admin_cleanup_not_configured")
        token = request.headers.get("x-admin-token", "")
        if token != expected:
            logger.warning("Invalid admin token attempt", extra="{}")
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
    audio_seconds: int,
) -> dict:
    """Simplified transaction for DEBUG_AUTH_BYPASS mode"""
    job_snap = job_ref.get()
    if not job_snap.exists:
        raise HTTPException(status_code=404, detail="job_not_found")
    job_data = job_snap.to_dict() or {}
    if job_data.get("uid") != uid:
        raise HTTPException(status_code=403, detail="forbidden")
    status = job_data.get("status", "created")
    if status in FINAL_JOB_STATUSES:
        return {"status": status, "skipped": True}

    yyyymm = job_data.get("yyyymm") or month_key(now_jst())
    usage_ref = db.collection("usage_monthly").document(usage_doc_id(uid, yyyymm))
    usage_snap = usage_ref.get()
    usage_data = usage_snap.to_dict() if usage_snap.exists else {}
    used = usage_data.get("usedSeconds", 0)
    try:
        used_seconds = int(used)
    except (TypeError, ValueError):
        used_seconds = 0
    new_used = used_seconds + audio_seconds

    usage_ref.set(
        {
            "uid": uid,
            "yyyymm": yyyymm,
            "usedSeconds": new_used,
            "updatedAt": datetime.now(timezone.utc),
        },
        merge=True,
    )
    job_ref.update(
        {
            "status": "succeeded",
            "audioSeconds": audio_seconds,
            "completedAt": datetime.now(timezone.utc),
        },
    )
    return {"status": "succeeded", "usedSeconds": new_used}


@firebase_firestore.transactional
def complete_job_transaction(
    transaction: firebase_firestore.Transaction,
    db: firebase_firestore.Client,
    job_ref: firebase_firestore.DocumentReference,
    uid: str,
    audio_seconds: int,
) -> dict:
    job_snap = job_ref.get(transaction=transaction)
    if not job_snap.exists:
        raise HTTPException(status_code=404, detail="job_not_found")
    job_data = job_snap.to_dict() or {}
    if job_data.get("uid") != uid:
        raise HTTPException(status_code=403, detail="forbidden")
    status = job_data.get("status", "created")
    if status in FINAL_JOB_STATUSES:
        return {"status": status, "skipped": True}

    yyyymm = job_data.get("yyyymm") or month_key(now_jst())
    usage_ref = db.collection("usage_monthly").document(usage_doc_id(uid, yyyymm))
    usage_snap = usage_ref.get(transaction=transaction)
    usage_data = usage_snap.to_dict() if usage_snap.exists else {}
    used = usage_data.get("usedSeconds", 0)
    try:
        used_seconds = int(used)
    except (TypeError, ValueError):
        used_seconds = 0
    new_used = used_seconds + audio_seconds

    transaction.set(
        usage_ref,
        {
            "uid": uid,
            "yyyymm": yyyymm,
            "usedSeconds": new_used,
            "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    transaction.update(
        job_ref,
        {
            "status": "succeeded",
            "audioSeconds": audio_seconds,
            "completedAt": firebase_firestore.SERVER_TIMESTAMP,
        },
    )
    return {"status": "succeeded", "usedSeconds": new_used}


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
async def create_token(vad_silence: int | None = Form(None)) -> JSONResponse:
    silence_ms = vad_silence if vad_silence is not None else 400

    payload = {
        "session": {
            "type": "realtime",
            "model": realtime_model_default,
            "audio": {
                "input": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "transcription": {"model": audio_model_default},
                    "turn_detection": {
                        "type": "server_vad",
                        "silence_duration_ms": silence_ms,
                    },
                },
                "output": {
                    "format": {"type": "audio/pcm", "rate": 24000},
                    "voice": "alloy",
                },
            },
        }
    }

    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

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
        raise HTTPException(
            status_code=status_code,
            detail=f"OpenAI API error ({status_code} {reason})",
        ) from exc
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="OpenAI request error",
        )

    raw_secret = data.get("value")
    if not isinstance(raw_secret, str) or not raw_secret.strip():
        raise HTTPException(status_code=502, detail="client_secret missing in OpenAI response")

# ★フロントが data.value を読む前提に合わせる
    return JSONResponse({"value": raw_secret})



@app.post("/api/v1/jobs/create")
async def create_job(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    yyyymm = month_key(current_jst)

    user_profile = ensure_user_profile(uid)
    plan = user_profile["plan"]
    quota_seconds = user_profile["quotaSeconds"]
    retention_days = user_profile["retentionDays"]

    used_seconds = get_used_seconds(db, uid, yyyymm)
    remaining_seconds = max(0, quota_seconds - used_seconds)
    if remaining_seconds <= 0:
        logger.warning(f"Quota exceeded for uid: {uid}", extra=json.dumps({"uid": uid, "plan": plan, "usedSeconds": used_seconds, "quotaSeconds": quota_seconds}))
        raise HTTPException(
            status_code=402,
            detail={
                "error": "quota_exceeded",
                "plan": plan,
                "usedSeconds": used_seconds,
                "quotaSeconds": quota_seconds,
            },
        )

    job_id = uuid.uuid4().hex
    delete_at = (current_jst + timedelta(days=retention_days)).astimezone(timezone.utc)
    job_data = {
        "uid": uid,
        "status": "created",
        "plan": plan,
        "quotaSeconds": quota_seconds,
        "retentionDays": retention_days,
        "yyyymm": yyyymm,
        "createdAt": firebase_firestore.SERVER_TIMESTAMP,
        "deleteAt": delete_at,
    }
    db.collection("jobs").document(job_id).set(job_data)

    logger.info(f"Job created", extra=json.dumps({"uid": uid, "jobId": job_id, "plan": plan, "remainingSeconds": remaining_seconds}))

    return JSONResponse(
        {
            "jobId": job_id,
            "yyyymm": yyyymm,
            "remainingSeconds": remaining_seconds,
            "plan": plan,
            "retentionDays": retention_days,
        }
    )


@app.post("/api/v1/jobs/complete")
async def complete_job(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    body = await request.json()
    job_id = body.get("jobId")
    audio_seconds_raw = body.get("audioSeconds")
    if not job_id:
        raise HTTPException(status_code=400, detail="jobId is required")
    try:
        audio_seconds = int(audio_seconds_raw)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="audioSeconds must be an integer")
    if audio_seconds < 0:
        raise HTTPException(status_code=400, detail="audioSeconds must be >= 0")

    db = get_firestore_client()
    job_ref = db.collection("jobs").document(job_id)

    # 【セキュリティガード】本番環境では simplified transaction を使わない
    use_simple = False
    if not IS_PRODUCTION:
        use_simple = os.getenv("DEBUG_AUTH_BYPASS") == "1"

    if use_simple:
        result = complete_job_transaction_simple(db, job_ref, uid, audio_seconds)
    else:
        transaction = db.transaction()
        result = complete_job_transaction(transaction, db, job_ref, uid, audio_seconds)

    logger.info(f"Job completed", extra=json.dumps({"uid": uid, "jobId": job_id, "audioSeconds": audio_seconds, "usedSeconds": result.get("usedSeconds")}))
    return JSONResponse(result)


@app.get("/api/v1/usage/remaining")
async def get_remaining_usage(request: Request) -> JSONResponse:
    uid = get_uid_from_request(request)
    db = get_firestore_client()
    current_jst = now_jst()
    yyyymm = month_key(current_jst)

    user_profile = ensure_user_profile(uid)
    quota_seconds = user_profile["quotaSeconds"]
    used_seconds = get_used_seconds(db, uid, yyyymm)
    remaining_seconds = max(0, quota_seconds - used_seconds)

    logger.info(f"Usage remaining retrieved", extra=json.dumps({"uid": uid, "plan": user_profile["plan"], "usedSeconds": used_seconds, "remainingSeconds": remaining_seconds}))

    return JSONResponse({
        "plan": user_profile["plan"],
        "quotaSeconds": quota_seconds,
        "usedSeconds": used_seconds,
        "remainingSeconds": remaining_seconds,
        "yyyymm": yyyymm,
    })


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
    # Set deleteAt to 1 day ago
    delete_at = (current_jst - timedelta(days=1)).astimezone(timezone.utc)
    job_data = {
        "uid": uid,
        "status": "succeeded",
        "plan": "free",
        "quotaSeconds": 1800,
        "retentionDays": 7,
        "yyyymm": yyyymm,
        "createdAt": datetime.now(timezone.utc),
        "deleteAt": delete_at,
    }
    db.collection("jobs").document(job_id).set(job_data)

    logger.info(f"Test expired job created: {job_id}", extra=json.dumps({"jobId": job_id}))
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
            logger.info(f"Deleted expired job: {job_id}", extra=json.dumps({"jobId": job_id, "deleteAt": str(job_data.get("deleteAt"))}))
        except Exception as e:
            errors += 1
            logger.error(f"Failed to delete job: {e}", extra=json.dumps({"error": str(e)}))

    result = {"deleted": deleted, "scanned": scanned, "errors": errors}
    logger.info(f"Cleanup completed", extra=json.dumps(result))
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
            metadata={"uid": uid},
            subscription_data={"metadata": {"uid": uid}},
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=body.get("email"),
        )
        logger.info(f"Checkout session created for uid: {uid}", extra=json.dumps({"uid": uid, "sessionId": session.id}))
        return JSONResponse({"sessionId": session.id, "url": session.url})
    except Exception as e:
        logger.error(f"Stripe checkout session creation failed: {e}", extra=json.dumps({"uid": uid, "error": str(e)}))
        raise HTTPException(status_code=500, detail=f"checkout_failed: {str(e)}")


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
        logger.error(f"No Stripe customer ID for uid: {uid}", extra=json.dumps({"uid": uid}))
        raise HTTPException(status_code=400, detail="no_customer_id")

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        logger.info(f"Portal session created for uid: {uid}", extra=json.dumps({"uid": uid, "customerId": customer_id}))
        return JSONResponse({"url": session.url})
    except Exception as e:
        logger.error(f"Stripe portal session creation failed: {e}", extra=json.dumps({"uid": uid, "error": str(e)}))
        raise HTTPException(status_code=500, detail=f"portal_failed: {str(e)}")


@app.post("/api/v1/billing/stripe/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """
    Stripe Webhook ハンドラー
    対応イベント:
    - customer.subscription.created/updated/deleted
    - invoice.paid
    - invoice.payment_failed
    """
    secret_key = os.getenv("STRIPE_SECRET_KEY")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not secret_key or not webhook_secret:
        raise HTTPException(status_code=500, detail="stripe_not_configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    stripe.api_key = secret_key

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError as exc:
        logger.error(f"Stripe webhook signature verification failed", extra="{}")
        raise HTTPException(status_code=400, detail="invalid_signature") from exc
    except ValueError as exc:
        logger.error(f"Stripe webhook invalid payload", extra="{}")
        raise HTTPException(status_code=400, detail="invalid_payload") from exc

    event_type = event.get("type", "")
    logger.info(f"Stripe webhook received: {event_type}", extra=json.dumps({"eventType": event_type, "eventId": event.get("id")}))

    db = get_firestore_client()

    # サブスクリプション関連イベント
    if event_type in ["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]:
        subscription = event["data"]["object"]
        metadata = subscription.get("metadata") or {}
        uid = metadata.get("uid")
        customer_id = subscription.get("customer")

        if not uid:
            logger.warning(f"Subscription event without uid metadata", extra=json.dumps({"eventType": event_type, "subscriptionId": subscription.get("id")}))
            # customer_idからuidを逆引きする試み
            if customer_id:
                users_query = db.collection("users").where("stripeCustomerId", "==", customer_id).limit(1)
                for user_doc in users_query.stream():
                    uid = user_doc.id
                    break

        if not uid:
            logger.error(f"Cannot determine uid from subscription event", extra=json.dumps({"eventType": event_type}))
            return JSONResponse({"received": True, "warning": "uid_not_found"})

        status = subscription.get("status", "")
        current_period_end = subscription.get("current_period_end")

        # ステータスに応じてプラン設定
        if status == "active":
            plan = "pro"
        else:
            plan = "free"

        plan_config = resolve_plan_config(plan)

        user_updates = {
            "plan": plan,
            "quotaSeconds": plan_config["quotaSeconds"],
            "retentionDays": plan_config["retentionDays"],
            "subscriptionStatus": status,
            "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
        }

        if customer_id:
            user_updates["stripeCustomerId"] = customer_id
        if current_period_end:
            user_updates["currentPeriodEnd"] = datetime.fromtimestamp(current_period_end, tz=timezone.utc)

        db.collection("users").document(uid).set(user_updates, merge=True)
        logger.info(f"User plan updated from subscription event", extra=json.dumps({"uid": uid, "plan": plan, "status": status}))

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
                logger.info(f"Invoice paid for uid: {uid}", extra=json.dumps({"uid": uid, "invoiceId": invoice.get("id")}))
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
                logger.warning(f"Invoice payment failed for uid: {uid}", extra=json.dumps({"uid": uid, "invoiceId": invoice.get("id")}))
                # 必要に応じて通知やフラグ設定
                break

    return JSONResponse({"received": True})




@app.post("/translate")
async def translate_text(text: str = Form(...)) -> JSONResponse:
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    # ★翻訳指示を system で明示（これが無いと翻訳されない/原文が返ることがある）
    payload = {
        "model": translate_model_default,
        "input": [
            {"role": "system", "content": "Translate the user's text into natural Japanese. Output Japanese only."},
            {"role": "user", "content": text},
        ],
    }

    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    result = await post_openai("https://api.openai.com/v1/responses", payload, headers)
    translated = extract_output_text(result)
    return JSONResponse({"translation": translated})



@app.post("/summarize")
async def summarize(text: str = Form(...)) -> JSONResponse:
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    prompt = (
        "You are a meeting summarizer. Produce concise Markdown with three sections: "
        "1) 要約 2) 重要ポイント (bullets) 3) 次のアクション (bullets)."
    )
    payload = {"model": summarize_model_default, "input": text, "system": prompt}
    api_key = get_openai_api_key()
    headers = {"Authorization": f"Bearer {api_key}"}
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
async def convert_audio(file: UploadFile = File(...)) -> JSONResponse:
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


@app.get("/healthz")
async def healthcheck() -> JSONResponse:
    return JSONResponse({"status": "ok"})


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
