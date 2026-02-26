from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import app as app_module


def test_normalize_input_lang_accepts_vi():
    assert app_module.normalize_input_lang("vi") == "vi"


def test_normalize_output_lang_accepts_vi():
    assert app_module.normalize_output_lang("vi") == "vi"


def test_normalize_output_lang_unknown_falls_back_to_ja():
    assert app_module.normalize_output_lang("unknown") == "ja"


def test_summarize_headers_include_vietnamese_labels():
    assert "vi" in app_module.SUMMARIZE_HEADERS
    headers = app_module.SUMMARIZE_HEADERS["vi"]
    assert headers["summary"] == "Tóm tắt"
    assert headers["key_points"] == "Điểm chính"
    assert headers["actions"] == "Hành động tiếp theo"
