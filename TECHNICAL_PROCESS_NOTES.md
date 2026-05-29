# Technical Process Notes

## Date
- May 28, 2026

## Scope of this change
- Add a simple username/password setup to protect access to student records.
- Keep existing React + Express + SQLite architecture.
- Document implementation steps in a dedicated notes file.

## Step-by-step implementation log

1. Reviewed current app architecture
- Confirmed frontend calls API routes under `/api/*`.
- Confirmed all persistence is currently SQLite-backed via server endpoints.

2. Designed simple auth approach
- Added an API login route that validates username/password.
- Added server-side bearer session tokens with expiration.
- Protected all API routes except health and login.

3. Added backend auth in `server/index.ts`
- Added credential config via env vars:
  - `APP_USERNAME`
  - `APP_PASSWORD`
  - `SESSION_TTL_SECONDS`
- Added `POST /api/auth/login`.
- Added `POST /api/auth/logout`.
- Added API middleware to enforce authentication for protected routes.
- Added session expiry refresh on successful requests.

4. Added frontend auth API helpers in `src/lib/api.ts`
- Added in-memory auth token storage.
- Added `login()`, `logout()`, `setAuthToken()`, and `clearAuthToken()`.
- Updated existing API calls to attach `Authorization: Bearer <token>`.
- Updated export download flow to fetch as blob with auth header instead of `window.open`.

5. Added login/logout UX in `src/App.tsx`
- Added sign-in screen when unauthenticated.
- Added session-aware data loading only after successful login.
- Added sign-out button in app header.
- Added auth-expiry handling to reset session and show sign-in when token is invalid.
- Updated export and summary actions to handle auth failures gracefully.

6. Updated docs
- Added auth setup instructions and env variable guidance in `README.md`.
- Added this implementation log file for traceability.

7. Verification plan
- Run TypeScript + build checks.
- Validate login flow locally:
  - Sign in with default/dev credentials or env-configured credentials.
  - Confirm protected API calls succeed after login.
  - Confirm sign out blocks access until login.

## Notes for deployment
- For Vercel, configure environment variables in Project Settings:
  - `APP_USERNAME`
  - `APP_PASSWORD`
- optional `SESSION_TTL_SECONDS`
- SQLite remains file-based; persistent writable storage behavior on serverless platforms should be reviewed before production use.

---

## Date
- May 29, 2026

## Scope of this change
- Capture product screenshots for GitHub showcase.
- Publish polished technical documentation explaining architecture, stack, and runtime behavior.

## Step-by-step implementation log

1. Implemented automated screenshot capture workflow
- Added `scripts/capture-showcase-screenshots.mjs` using Playwright.
- Script logs into the deployed app, navigates major product views, and saves screenshots in `docs/screenshots/`.
- Captured:
  - Login
  - Dashboard overview
  - Dashboard reporting panel
  - Student Pokedex
  - Student profile drawer
  - Assignment matrix
  - Attendance view
  - Archive view
  - Mobile dashboard

2. Added screenshot asset library
- Created `docs/screenshots/` and populated production screenshots for README embedding.

3. Rewrote GitHub-facing README
- Added live app + repo links.
- Added full visual feature tour with embedded screenshots.
- Added stack, architecture diagram, feature list, data model notes, auth setup, deployment notes, and screenshot regeneration instructions.

4. Added formal technical architecture document
- Created `docs/TECHNICAL_OVERVIEW.md`.
- Documented:
  - System architecture
  - API routes
  - Rule engine model
  - Data contracts
  - Seed mapping behavior
  - Runtime persistence differences (local SQLite vs Vercel in-memory)

5. Validation
- Confirmed screenshots were generated and written under `docs/screenshots`.
- Confirmed README references match generated screenshot filenames.

---

## Date
- May 29, 2026

## Scope of this change
- Add UI privacy toggle to redact PII for public screenshots and demos.
- Regenerate all documentation screenshots with PII redaction enabled.

## Step-by-step implementation log

1. Added PII redaction mode in frontend
- Added `Hide PII` / `Show PII` toggle in app header.
- Added redaction helpers for student display name and email.
- Redacted high-visibility PII surfaces across dashboard, student cards, matrix, attendance, archive, and profile panel.
- Disabled direct Email/LinkedIn quick actions while PII mode is enabled.
- Added visible banner indicating that PII hidden mode is active.

2. Updated screenshot automation
- Updated `scripts/capture-showcase-screenshots.mjs` to auto-enable PII mode before capturing.
- Added `HIDE_PII` env switch (defaults to `true`) for capture behavior control.

3. Regenerated documentation screenshots
- Re-captured all showcase images in `docs/screenshots/` with redaction enabled.

4. Updated docs
- Updated `README.md` to include PII toggle in features and screenshot command docs.
- Updated `docs/TECHNICAL_OVERVIEW.md` security notes with PII mode behavior.
