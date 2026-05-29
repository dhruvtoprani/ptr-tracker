# Technical Overview: Pathway Command Center

## 1. Purpose

Pathway Command Center is a mentor-facing student tracking application for the Pathway to Research program. It centralizes:

- Student profile management
- Assignment tracking and grading
- Attendance logging
- Advising session history
- Activity/risk analytics
- Export-ready reporting

## 2. System Architecture

### Frontend

- React 19 + TypeScript (single-page app)
- Vite build tooling
- Tailwind CSS design tokens and utility styling
- Recharts for KPI/distribution charts
- Custom component primitives inspired by shadcn/ui patterns

### Backend

- Express 5 API under `/api/*`
- Zod request validation for critical payloads
- Shared domain logic in `shared/` for deterministic rule calculations

### Runtime Storage

- Local/dev runtime: SQLite (`better-sqlite3`) in `data/pathway-command-center.db`
- Vercel runtime: in-memory state store fallback

### Auth

- Username/password login endpoint
- In-memory bearer token session map with TTL refresh
- API middleware protection for all routes except `/api/health` and `/api/auth/login`

## 3. Source Layout

- `src/`: frontend app, views, UI components, client API wrapper
- `server/`: Express server, seed transformation, state storage engine
- `shared/`: types, rule engine, derived dashboard/report metrics
- `api/index.ts`: Vercel serverless entrypoint
- `docs/screenshots/`: README showcase screenshots

## 4. API Surface

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/login` | Login and token issuance |
| `POST` | `/api/auth/logout` | Logout and token invalidation |
| `GET` | `/api/state` | Read full application state |
| `PUT` | `/api/state` | Save full application state (recalculates derived metrics) |
| `POST` | `/api/reset` | Reset state from configured private seed |
| `GET` | `/api/dashboard-metrics` | Aggregated dashboard metrics |
| `GET` | `/api/supervisor-summary` | Generated narrative summary |
| `GET` | `/api/export/json` | Full JSON export |
| `GET` | `/api/export/students.csv` | Student summary CSV |
| `GET` | `/api/export/assignments.csv` | Assignment progress CSV |
| `GET` | `/api/export/attendance.csv` | Attendance CSV |
| `GET` | `/api/export/advising.csv` | Advising session CSV |

## 5. Rule Engine Design

Rule functions live in `shared/rules.ts` and are executed during every state save, ensuring deterministic analytics.

### Activity scoring (`0-100`)

- Assignment section (max 40)
- Attendance section (max 35)
- Advising engagement section (max 15)
- Engagement quality section (max 10)

Computed score maps to:

- `85-100`: Excellent
- `70-84`: High
- `50-69`: Moderate
- `25-49`: Low
- `0-24`: Inactive

Manual activity override is supported and labeled explicitly in the model.

### Drop-off risk

Risk levels:

- `Low`
- `Watch`
- `High`
- `Dropped`

Rules consider:

- Missing assignments
- Recent absences/no-shows
- Advising recency
- Activity score thresholds
- Manual dropped flag and archive reason logic

## 6. Data Modeling

Shared TS contracts live in `shared/types.ts` and include:

- `Student`
- `AssignmentType`
- `StudentAssignmentRecord`
- `AttendanceRecord`
- `AdvisingSession`
- `ActivityState`
- `RiskState`
- `AppState`

This schema design keeps the UI layer decoupled from persistence details, making later migration to Supabase/Neon straightforward.

## 7. Private Seeding Strategy

Seed loading in `server/seedData.ts` now uses private sources only:

- `PTR_SEED_STATE_B64` (base64-encoded `AppState` JSON)
- `PTR_SEED_STATE_JSON`
- `PTR_SEED_STATE_FILE` (local/private filesystem path)
- fallback path `data/private/seed-state.json` (gitignored)

If none are configured, startup seed is an empty tracker state.

## 8. Persistence Behavior by Environment

### Local / self-hosted Node runtime

- Uses SQLite file persistence.
- State survives process restarts.

### Vercel serverless runtime

- Uses in-memory storage.
- State is process-bound and can reset when the function instance is recycled.

If durable cloud persistence is required on Vercel, recommended next step is a managed DB provider (for example, Neon Postgres or Supabase).

## 9. Security Notes

- Credential comparison uses constant-time checks (`timingSafeEqual`).
- Session TTL is configurable (`SESSION_TTL_SECONDS`).
- Frontend stores the token in memory only (no localStorage token persistence).
- UI includes a runtime `Hide PII` mode that redacts student names/emails/LinkedIn fields for demos and public screenshots.
- Production runtime requires `APP_USERNAME` and `APP_PASSWORD`.
- Real student seed records should be stored only in private environment variables or private files, not in Git.

## 10. Screenshot/Showcase Automation

Script: `scripts/capture-showcase-screenshots.mjs`

What it does:

- Opens the live app
- Authenticates with provided credentials
- Captures major views (dashboard, students, profile, assignments, attendance, archive, mobile)
- Saves outputs to `docs/screenshots/`
