# AGENTS.md

## Project structure

Two independent packages (not a monorepo — no shared workspaces or tooling):

- **`my-app/`** — Expo SDK 54 + React Native 0.81 frontend (TypeScript, expo-router file-based routing)
- **`nutrition-backend/`** — Express 5 backend (CommonJS, Mongoose, Google Gemini AI)

## Running locally

```bash
# Backend (port 3000, requires .env)
cd nutrition-backend
npm install
node server.js

# Frontend (Expo dev server)
cd my-app
npm install
npx expo start
```

No test suites exist in either package. No CI/CD configuration.

## Lint

```bash
cd my-app && npx expo lint
```

ESLint config uses `eslint-config-expo` (flat config). No Prettier or formatter configured.

## Key gotchas

- **Two conflicting API base URLs on frontend**: `services/api.ts` uses `http://localhost:3000/api`, while `constants/config.ts` uses `http://10.168.100.38:3000`. These must match your dev environment.
- **Backend uses Express 5** (not 4) — some middleware patterns differ.
- **Backend mixes Mongoose models with raw `db.collection()` access** — some controllers use Mongoose models, others use `mongoose.connection.db.collection()` directly. Be aware of both patterns.
- **DB connection forces Google DNS** (`8.8.8.8`) in `config/db.js` to work around SRV resolution issues on certain networks.
- **Backend needs `.env`** with `GEMINI_API_KEY`, `MONGODB_URI`, and `PORT`. The file is gitignored.
- **Firebase config** exists in `.env` as `VITE_FIREBASE_*` vars — unclear usage in frontend currently.
- **Thai language** used throughout: UI labels, error messages, API responses, and food names. Backend normalizes Thai strings for gender, goals, and activity levels.

## Architecture notes

- **Auth**: Email/password via bcrypt. No JWT — session is held in-memory on the client (`services/session.ts`).
- **Registration flow**: 9-step onboarding wizard (step1–step9) using React Context (`context/register-context.tsx`). Data is collected locally then POSTed to `/api/auth/register` in one call.
- **AI food scanning**: Photos are sent to Gemini API, which identifies the dish, then the backend looks it up in the `MasterFood` MongoDB collection (exact match → keyword match → partial match).
- **Notifications**: A `node-cron` job runs every minute, matching meal schedule times against current time to insert notifications into MongoDB.
- **Streak tracking**: `utils/streakUpdater.js` updates `current_streak` on the User document after each meal log is saved.

## MongoDB collections used

`Users`, `MasterFood`, `Ingredient`, `MealLogs`, `WaterLogs`, `ScanSessions`, `Notifications`, `BodyLogs` — some accessed via Mongoose models, some via raw driver.

## Frontend routing

Expo Router file-based routing under `my-app/app/`:
- `(tabs)/` — main tab navigation (dashboard, record, scan, plan, profile)
- `register/` — 9-step onboarding (step1 through step9, plus summary)
- `food-scan/` — camera scan flow (index → result)
- `meal-entry/` — manual meal logging
- `profile/` — profile editing screens
- Standalone: `login`, `cart`, `water-log`, `weekly`, `notifications`
