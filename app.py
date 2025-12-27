import asyncio
import base64
import os
import uuid
from pathlib import Path

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable must be set")

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
DOWNLOAD_DIR = BASE_DIR / "downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

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


@app.post("/token")
async def create_token(
    vad_silence: int | None = Form(None),
    max_duration_ms: int | None = Form(None),
) -> JSONResponse:
    silence_ms = vad_silence if vad_silence is not None else 400
    payload = {
        "model": "gpt-4o-mini-realtime-preview",
        "session": {
            "type": "transcription",
            "audio": {
                "input": {
                    "transcription": {"model": audio_model_default},
                    "turn_detection": {
                        "type": "server_vad",
                        "silence_duration_ms": silence_ms,
                    },
                }
            },
        }
    }
    if max_duration_ms:
        payload["session"]["max_response_output_tokens"] = max_duration_ms

    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
    data = await post_openai(
        "https://api.openai.com/v1/realtime/client_secrets", payload, headers
    )
    raw_secret = data.get("client_secret") or data.get("data", {}).get("client_secret")
    if isinstance(raw_secret, dict):
        raw_secret = raw_secret.get("value")
    if not isinstance(raw_secret, str) or not raw_secret.strip():
        raise HTTPException(status_code=502, detail="client_secret missing in OpenAI response")

    return JSONResponse({"client_secret": raw_secret})


@app.post("/translate")
async def translate_text(text: str = Form(...)) -> JSONResponse:
    if not text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    payload = {
        "model": translate_model_default,
        "input": text,
        "system": "Translate the input into Japanese. Return only the translated text.",
    }
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
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
    headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
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
    path = DOWNLOAD_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(path, filename=filename)
