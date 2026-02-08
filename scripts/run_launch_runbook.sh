#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_DIR="$ROOT_DIR/ops/logs"
LOG_FILE="$LOG_DIR/launch_run_${TIMESTAMP}.md"

PASS_COUNT=0
FAIL_COUNT=0
SKIPPED_COUNT=0

mkdir -p "$LOG_DIR"

append_line() {
  printf '%s\n' "$1" >>"$LOG_FILE"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

record_result() {
  local step="$1"
  local command_text="$2"
  local stdout_file="$3"
  local stderr_file="$4"
  local exit_code="$5"
  local judge="$6"

  append_line "## ${step}"
  append_line ""
  append_line "- command: \`${command_text}\`"
  append_line "- exit_code: \`${exit_code}\`"
  append_line "- judge: **${judge}**"
  append_line ""
  append_line "### stdout"
  append_line '```text'
  if [[ -s "$stdout_file" ]]; then
    cat "$stdout_file" >>"$LOG_FILE"
  else
    append_line "(empty)"
  fi
  append_line '```'
  append_line ""
  append_line "### stderr"
  append_line '```text'
  if [[ -s "$stderr_file" ]]; then
    cat "$stderr_file" >>"$LOG_FILE"
  else
    append_line "(empty)"
  fi
  append_line '```'
  append_line ""
}

record_skipped() {
  local step="$1"
  local command_text="$2"
  local reason="$3"

  SKIPPED_COUNT=$((SKIPPED_COUNT + 1))

  append_line "## ${step}"
  append_line ""
  append_line "- command: \`${command_text}\`"
  append_line "- exit_code: \`N/A\`"
  append_line "- judge: **SKIPPED (${reason})**"
  append_line ""
  append_line "### stdout"
  append_line '```text'
  append_line "(not executed)"
  append_line '```'
  append_line ""
  append_line "### stderr"
  append_line '```text'
  append_line "(not executed)"
  append_line '```'
  append_line ""
}

run_cmd() {
  local step="$1"
  local command_text="$2"
  local stdout_file
  local stderr_file
  local exit_code
  local judge

  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"

  set +e
  bash -lc "$command_text" >"$stdout_file" 2>"$stderr_file"
  exit_code=$?
  set -e

  if [[ $exit_code -eq 0 ]]; then
    judge="PASS"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    judge="FAIL"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  record_result "$step" "$command_text" "$stdout_file" "$stderr_file" "$exit_code" "$judge"

  rm -f "$stdout_file" "$stderr_file"
}

run_optional_cmd() {
  local required_bin="$1"
  local step="$2"
  local command_text="$3"

  if has_cmd "$required_bin"; then
    run_cmd "$step" "$command_text"
  else
    record_skipped "$step" "$command_text" "${required_bin} not found"
  fi
}

append_line "# Launch MVP Runbook Execution Log"
append_line ""
append_line "- Timestamp: \`$(date '+%Y-%m-%d %H:%M:%S %z')\`"
append_line "- Policy: **No deploy execution**"
append_line "- Project: \`realtime-translator-pwa-483710\`"
append_line "- Runbook source: \`docs/launch_mvp_runbook.md\`"
append_line ""

MISSING_REQUIRED=()
for cmd in git node curl; do
  if ! has_cmd "$cmd"; then
    MISSING_REQUIRED+=("$cmd")
  fi
done

if [[ ${#MISSING_REQUIRED[@]} -gt 0 ]]; then
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  {
    printf 'Missing required commands:\n'
    for cmd in "${MISSING_REQUIRED[@]}"; do
      printf '- %s\n' "$cmd"
    done
  } >"$stderr_file"
  : >"$stdout_file"

  FAIL_COUNT=$((FAIL_COUNT + 1))
  record_result "Environment check" "command -v git node curl" "$stdout_file" "$stderr_file" "1" "FAIL"
  rm -f "$stdout_file" "$stderr_file"

  append_line "## Summary"
  append_line ""
  append_line "- PASS: ${PASS_COUNT}"
  append_line "- FAIL: ${FAIL_COUNT}"
  append_line "- SKIPPED: ${SKIPPED_COUNT}"
  append_line ""
  append_line "Log file: \`${LOG_FILE}\`"
  echo "FAIL: missing required commands. See $LOG_FILE" >&2
  exit 1
fi

append_line "## Environment"
append_line ""
append_line "- Required commands available: \`git,node,curl\`"
append_line "- Optional command \`firebase\`: $(has_cmd firebase && echo available || echo missing)"
append_line "- Optional command \`gcloud\`: $(has_cmd gcloud && echo available || echo missing)"
append_line ""

append_line "# Pre-flight"
append_line ""

run_optional_cmd firebase "Pre-flight: active Firebase project" "firebase use"
run_optional_cmd gcloud "Pre-flight: active gcloud project" "gcloud config get-value project"
run_cmd "Pre-flight: git status" "git status --short"
run_cmd "Pre-flight: pricing check" "node ./scripts/generate_pricing.js --check"
run_cmd "Pre-flight: static/public sync check" "./scripts/check_public_sync.sh"
run_cmd "Pre-flight: firebase region config" "grep '\"region\"' firebase.json | sort -u"
run_cmd "Pre-flight: pack ID drift check" "diff <(grep -oE '\"t[0-9]+\"' app.py | tr -d '\"' | sort -u) <(grep -oE '\"packId\"[[:space:]]*:[[:space:]]*\"t[0-9]+\"' static/config/pricing.json | grep -oE 't[0-9]+' | sort -u)"

append_line "# Deploy (record only, no execution)"
append_line ""
record_skipped "Deploy command (Cloud Run)" "gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=asia-northeast1" "no-deploy policy"
record_skipped "Deploy command (Cloud Run health check)" "curl -fsS https://realtime-translator-api-853238768850.asia-northeast1.run.app/health" "no-deploy policy"
record_skipped "Deploy command (Firestore rules)" "firebase deploy --only firestore:rules --project realtime-translator-pwa-483710" "no-deploy policy"
record_skipped "Deploy command (Hosting)" "npm run deploy:hosting" "no-deploy policy"

append_line "# Smoke"
append_line ""
run_cmd "Smoke: hosting health" "curl -fsS https://realtime-translator-pwa-483710.web.app/health"
run_cmd "Smoke: build timestamp" "curl -fsS https://realtime-translator-pwa-483710.web.app/build.txt"
run_optional_cmd gcloud "Smoke: Cloud Run ERROR logs" "gcloud logging read 'resource.type=\"cloud_run_revision\" AND severity>=ERROR AND resource.labels.service_name=\"realtime-translator-api\"' --limit=10 --freshness=5m --project=realtime-translator-pwa-483710"

append_line "## Summary"
append_line ""
append_line "- PASS: ${PASS_COUNT}"
append_line "- FAIL: ${FAIL_COUNT}"
append_line "- SKIPPED: ${SKIPPED_COUNT}"
append_line ""
append_line "Log file: \`${LOG_FILE}\`"

if [[ $FAIL_COUNT -gt 0 ]]; then
  echo "FAIL: one or more steps failed. See $LOG_FILE" >&2
  exit 1
fi

echo "PASS: launch runbook checks completed. Log: $LOG_FILE"
