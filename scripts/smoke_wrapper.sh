#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# smoke_wrapper.sh
# Wrapper for smoke_check.sh with:
#   - Daily log rotation (14-day retention)
#   - macOS Notification Center alerts on FAIL/RECOVERY
# ============================================================

REPO_ROOT="/Users/nakamurayoshiki/src/realtime-translator-pwa-main"
LOGS_DIR="${REPO_ROOT}/ops/logs"
API_BASE="${API_BASE:-https://realtime-translator-api-853238768850.asia-northeast1.run.app}"
RETENTION_DAYS=14

# Log files
OUT_LOG="${LOGS_DIR}/smokecheck.out"
ERR_LOG="${LOGS_DIR}/smokecheck.err"
STATE_FILE="${LOGS_DIR}/smokecheck.state"
ROTATED_MARKER="${LOGS_DIR}/smokecheck.rotated_date"

# Debounce and timing files
LAST_NOTIFY_FILE="${LOGS_DIR}/smokecheck.last_notify"
FAIL_START_FILE="${LOGS_DIR}/smokecheck.fail_start"

# Timing constants (seconds)
NOTIFY_DEBOUNCE_SECS=60
MIN_FAIL_DURATION_SECS=60

# Ensure logs directory exists
mkdir -p "${LOGS_DIR}"

# ============================================================
# Log rotation (daily, based on marker file)
# ============================================================
rotate_logs() {
  local today
  today="$(date +%F)"

  local last_rotated=""
  if [[ -f "${ROTATED_MARKER}" ]]; then
    last_rotated="$(cat "${ROTATED_MARKER}" 2>/dev/null || true)"
  fi

  if [[ "${last_rotated}" != "${today}" ]]; then
    # Determine date for archived logs (use marker date if available, else yesterday)
    local archive_date
    if [[ -n "${last_rotated}" ]]; then
      archive_date="${last_rotated}"
    else
      archive_date="$(date -v-1d +%F 2>/dev/null || date -d 'yesterday' +%F 2>/dev/null || date +%F)"
    fi

    # Archive existing logs if they exist and are non-empty
    if [[ -s "${OUT_LOG}" ]]; then
      mv "${OUT_LOG}" "${OUT_LOG}.${archive_date}"
    fi
    if [[ -s "${ERR_LOG}" ]]; then
      mv "${ERR_LOG}" "${ERR_LOG}.${archive_date}"
    fi

    # Create fresh log files
    : > "${OUT_LOG}"
    : > "${ERR_LOG}"

    # Update marker
    echo "${today}" > "${ROTATED_MARKER}"
  fi
}

# ============================================================
# Cleanup old rotated logs (older than RETENTION_DAYS)
# ============================================================
cleanup_old_logs() {
  find "${LOGS_DIR}" -type f \( -name 'smokecheck.out.????-??-??' -o -name 'smokecheck.err.????-??-??' \) -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
}

# ============================================================
# Debounce helpers
# ============================================================
get_epoch() {
  date +%s
}

# Check if notification should be debounced
# Returns 0 (true) if should debounce (skip), 1 (false) if ok to notify
should_debounce() {
  local now last_notify elapsed
  now="$(get_epoch)"
  if [[ -f "${LAST_NOTIFY_FILE}" ]]; then
    last_notify="$(cat "${LAST_NOTIFY_FILE}" 2>/dev/null || echo 0)"
    elapsed=$((now - last_notify))
    if [[ ${elapsed} -lt ${NOTIFY_DEBOUNCE_SECS} ]]; then
      return 0  # should debounce
    fi
  fi
  return 1  # ok to notify
}

update_last_notify() {
  get_epoch > "${LAST_NOTIFY_FILE}"
}

# Record when FAIL state started
record_fail_start() {
  if [[ ! -f "${FAIL_START_FILE}" ]]; then
    get_epoch > "${FAIL_START_FILE}"
  fi
}

# Get FAIL duration in seconds (0 if no fail_start recorded)
get_fail_duration() {
  if [[ -f "${FAIL_START_FILE}" ]]; then
    local fail_start now
    fail_start="$(cat "${FAIL_START_FILE}" 2>/dev/null || echo 0)"
    now="$(get_epoch)"
    echo $((now - fail_start))
  else
    echo 0
  fi
}

clear_fail_start() {
  rm -f "${FAIL_START_FILE}"
}

# ============================================================
# macOS Notification (terminal-notifier preferred, osascript fallback)
# ============================================================
find_terminal_notifier() {
  # Try command -v first (works if in PATH)
  if command -v terminal-notifier >/dev/null 2>&1; then
    command -v terminal-notifier
    return 0
  fi
  # Try common Homebrew paths (launchd may not have /opt/homebrew/bin in PATH)
  for path in /opt/homebrew/bin/terminal-notifier /usr/local/bin/terminal-notifier; do
    if [[ -x "${path}" ]]; then
      echo "${path}"
      return 0
    fi
  done
  return 1
}

notify() {
  local message="$1"
  local title="${2:-RTTranslator Smokecheck}"
  local ts
  ts="$(date -u +%FT%TZ)"
  local notifier_path

  # Try terminal-notifier first
  if notifier_path="$(find_terminal_notifier)"; then
    if "${notifier_path}" -title "${title}" -message "${message}" 2>>"${ERR_LOG}"; then
      echo "[${ts}] notify: sent via terminal-notifier (${notifier_path})" >> "${ERR_LOG}"
      return 0
    else
      echo "[${ts}] notify: terminal-notifier failed (${notifier_path}), trying osascript" >> "${ERR_LOG}"
    fi
  else
    echo "[${ts}] notify: terminal-notifier not found, using osascript fallback" >> "${ERR_LOG}"
  fi

  # Fallback to osascript
  if osascript -e "display notification \"${message}\" with title \"${title}\"" 2>>"${ERR_LOG}"; then
    echo "[${ts}] notify: sent via osascript" >> "${ERR_LOG}"
    return 0
  else
    echo "[${ts}] notify: osascript also failed" >> "${ERR_LOG}"
    return 1
  fi
}

# ============================================================
# Main
# ============================================================

# Rotate logs if needed
rotate_logs

# Cleanup old logs
cleanup_old_logs

# Read previous state
prev_state=""
if [[ -f "${STATE_FILE}" ]]; then
  prev_state="$(cat "${STATE_FILE}" 2>/dev/null || true)"
fi

# Run smoke check
echo "[smoke_wrapper] API_BASE=${API_BASE}"
exit_code=0
API_BASE="${API_BASE}" "${REPO_ROOT}/scripts/smoke_check.sh" || exit_code=$?

# Handle result with state transition detection and debouncing
ts="$(date -u +%FT%TZ)"
if [[ ${exit_code} -eq 0 ]]; then
  new_state="OK"
  echo "${new_state}" > "${STATE_FILE}"
  if [[ "${prev_state}" == "FAIL" ]]; then
    # FAIL -> OK: recovery
    fail_duration="$(get_fail_duration)"
    echo "[${ts}] state transition: FAIL -> OK (recovery, fail_duration=${fail_duration}s)" >> "${ERR_LOG}"
    clear_fail_start
    if [[ ${fail_duration} -lt ${MIN_FAIL_DURATION_SECS} ]]; then
      echo "[${ts}] skip recovery notify: fail_duration ${fail_duration}s < ${MIN_FAIL_DURATION_SECS}s" >> "${ERR_LOG}"
    elif should_debounce; then
      echo "[${ts}] debounced: recovery notify skipped (within ${NOTIFY_DEBOUNCE_SECS}s of last notify)" >> "${ERR_LOG}"
    else
      notify "Smokecheck recovered (PASS)" "RTTranslator Smokecheck"
      update_last_notify
    fi
  else
    echo "[${ts}] no state change (${prev_state:-empty} -> OK); skip notify" >> "${ERR_LOG}"
    clear_fail_start
  fi
else
  new_state="FAIL"
  echo "${new_state}" > "${STATE_FILE}"
  record_fail_start
  if [[ "${prev_state}" != "FAIL" ]]; then
    # OK/empty -> FAIL: new failure
    echo "[${ts}] state transition: ${prev_state:-empty} -> FAIL" >> "${ERR_LOG}"
    if should_debounce; then
      echo "[${ts}] debounced: fail notify skipped (within ${NOTIFY_DEBOUNCE_SECS}s of last notify)" >> "${ERR_LOG}"
    else
      notify "Smokecheck FAILED. Check ops/logs/smokecheck.err" "RTTranslator Smokecheck"
      update_last_notify
    fi
  else
    echo "[${ts}] no state change (FAIL -> FAIL); skip notify" >> "${ERR_LOG}"
  fi
fi

# Exit with smoke_check.sh exit code
exit ${exit_code}
