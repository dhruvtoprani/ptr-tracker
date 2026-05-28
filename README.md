# Pathway Command Center

Pathway Command Center is a React + TypeScript app for managing Pathway to Research students with a SQLite-backed API.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (green-and-white design system)
- shadcn-style UI primitives
- Recharts
- Express API
- SQLite (`better-sqlite3`) persistence

## Key Features

- Dashboard with activity/risk/attendance/reporting metrics
- Student Pokedex cards + full profile panel
- Global assignment creation that auto-populates all active students
- Assignment matrix inline updates
- Global attendance session logging with per-student overrides
- Advising session cards per student
- Activity score + drop-off risk rule engine
- Manual activity override with reason
- Archive + restore flow
- JSON and CSV exports + supervisor summary generator

## Data and Persistence

- No `localStorage` is used.
- All app state persists in SQLite at:
  - `data/pathway-command-center.db`
- Initial seed data is loaded from the roster rows in:
  - `server/seedData.ts`

## Run

```bash
npm install
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:8787](http://localhost:8787)

## Build

```bash
npm run build
```
