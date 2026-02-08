## Summary
Change default Cloud Build region in `cloudbuild.yaml` from `us-central1` to `asia-northeast1`.

## Change
- One-line update only:
  - `substitutions._REGION: us-central1`
  - -> `substitutions._REGION: asia-northeast1`

## Impact
- When `_REGION` is not overridden, build artifact path and Cloud Run deploy target default to Tokyo region.
- Reduces mismatch risk with existing runbook guidance that uses `asia-northeast1`.

## Verification (record only, do not deploy in this task)
- Static diff check confirms one-line change in `cloudbuild.yaml`.
- Example command for future operational verification:
  - `gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=asia-northeast1`

## Rollback
- Revert the same one line back to `us-central1`.
- Safe rollback path: `git revert <commit_sha>`.
