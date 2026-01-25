# Development Guardrails

This document describes the coding standards and checks that prevent initialization failures in the PWA.

## Background

On 2026-01-25, a production incident caused the login button to become unresponsive. The root cause was a **Temporal Dead Zone (TDZ) error** where `fetchBuildSha()` was called before its `const` definition, crashing `DOMContentLoaded` and preventing all subsequent event handler registrations.

## Rules

### 1. Use `function` declarations for functions called in DOMContentLoaded

**Bad (TDZ risk):**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  doSomething(); // ReferenceError if called before definition

  const doSomething = () => { ... }; // const is NOT hoisted
});
```

**Good (TDZ-safe):**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  doSomething(); // Works because function declarations are hoisted

  function doSomething() { ... } // Hoisted to top of scope
});
```

### 2. Separate Critical and Non-Critical initialization

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Critical: Login, main UI - failures shown to user but app tries to continue
  function initCritical() {
    // Login button, auth, core features
  }

  // Non-Critical: SW, BUILD display - failures silently logged
  function initNonCritical() {
    try { setupServiceWorker(); } catch (e) { console.warn(e); }
    try { fetchBuildSha(); } catch (e) { console.warn(e); }
  }

  try { initCritical(); } catch (e) { showError(e); }
  try { initNonCritical(); } catch (e) { /* silent */ }
});
```

### 3. Wrap non-critical features in try/catch

Non-critical features (SW updates, BUILD display, diagnostics) must never crash the app:

```javascript
// Each non-critical feature is individually protected
try {
  fetchBuildSha();
} catch (err) {
  console.warn('[INIT:non-critical] fetchBuildSha failed:', err);
}
```

## Automated Checks

### verify_no_tdz.sh

Detects functions defined with `const`/`let` that are called before their definition:

```bash
./scripts/verify_no_tdz.sh
```

### smoke_dom_init.sh

Verifies critical UI elements exist and have event handlers:

```bash
./scripts/smoke_dom_init.sh
```

### Running all checks

```bash
./scripts/sync_public.sh && ./scripts/check_public_sync.sh
```

To enforce quality checks as failures:

```bash
STRICT_CHECKS=1 ./scripts/check_public_sync.sh
```

## Checklist for New Features

When adding new functionality to `DOMContentLoaded`:

- [ ] Use `function` declarations (not `const`/`let`) for any function called before its definition
- [ ] Wrap non-critical features in individual `try/catch` blocks
- [ ] Run `./scripts/smoke_dom_init.sh` to verify critical elements are intact
- [ ] Run `./scripts/verify_no_tdz.sh` to check for TDZ issues
