# Work Done

## Project
- Pathway Command Center (`ptr-tracker`)

## Completed Implementation

1. Built full app architecture
- Frontend: React + TypeScript + Vite + Tailwind UI system.
- Backend: Express API.
- Persistence: SQLite (`better-sqlite3`) with seeded state support.

2. Implemented core product views
- Dashboard with KPI cards and charts.
- Student Pokedex browse cards.
- Individual student profile panel.
- Assignment Matrix view with inline status/grade updates.
- Attendance session view.
- Archive and restore view.

3. Implemented student operations
- Add/edit student details.
- Track assignments per student.
- Log attendance records.
- Add and maintain advising session cards.
- Maintain private mentor notes.
- Archive and restore students with reasons/notes.

4. Implemented global assignment flow
- Create assignment type once.
- Auto-populate assignment records for every active student.

5. Implemented rule engines
- Activity score and level computation.
- Drop-off risk computation.
- Dashboard and reporting metrics derived from state.

6. Implemented reporting/export features
- JSON export.
- Student summary CSV.
- Assignment progress CSV.
- Attendance CSV.
- Advising sessions CSV.
- Supervisor summary generator.

7. Seeded roster mapping
- Mapped roster fields into student/profile structures.
- Left `major` and `year` blank/editable by default.
- Normalized multi-email handling with MSU-first preference.

8. Added simple username/password protection
- Backend auth endpoints:
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
- Protected API middleware on `/api/*` routes (except health/login).
- Token-based in-memory session handling with TTL.
- Frontend sign-in screen and sign-out button.
- Auth-aware API wrapper and secure export download flow.

9. Added documentation
- `README.md` updated with auth/env configuration.
- `TECHNICAL_PROCESS_NOTES.md` created with step-by-step implementation log.

## Configuration Added

- `APP_USERNAME` (default: `mentor`)
- `APP_PASSWORD` (default: `pathway2026`)
- `SESSION_TTL_SECONDS` (default: `43200`)

## Validation Performed

- Build and type checks:
  - `npm run build` passed successfully.

## Repository Status

- Code pushed to GitHub:
  - `https://github.com/dhruvtoprani/ptr-tracker`
