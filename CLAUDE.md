# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Rules

- Always use TypeScript — never use `any`, always type properly
- Use Tailwind for all styling
- API routes go in `/src/api`

## Commands

All app commands run from the `the-one/` directory:

```bash
npm run dev      # Start dev server (Vite, port 3000 or $PORT)
npm run build    # Production build → the-one/dist/
npm run preview  # Preview production build locally
npm start        # Serve dist/ (requires PORT env var)
```

Firebase deployment (from root):
```bash
firebase deploy  # Deploys hosting, Firestore rules, Storage rules
```

No linting or test scripts are configured.

## Architecture

**Stack:** React 19 + TypeScript SPA, Firebase backend, Gemini 2.5 Pro for AI generation, deployed via Firebase Hosting.

**Entry points:**
- `the-one/index.tsx` — React root mount
- `the-one/App.tsx` — Central router and global state (auth, site settings, role-based routing)
- `the-one/firebase.ts` — Firebase SDK initialization (auth, db, storage, AI model, FCM, App Check)
- `the-one/types.ts` — All TypeScript interfaces (User, Course, Exercise, Workout, MealPlan, etc.)

**Routing:** HashRouter (client-side, no server config needed). Routes are gated by user role stored in `localStorage` as `auth_user`.

**User roles:** `CLIENT`, `COACH`, `ADMIN`, `SUPPORT` — each maps to a distinct layout/dashboard (`/pages/admin/`, `/pages/coach/`, `/pages/support/`).

**Admin impersonation:** stored in `localStorage` as `original_admin` — admins can view the app as other users.

## Firebase / Data Layer

**Firestore collections:**
| Collection | Purpose |
|---|---|
| `users/{userId}` | Profiles, role, FCM token; subcollection `progress` |
| `courses/{courseId}` | Coach-created multi-week programs |
| `custom_requests/{id}` | Bespoke program requests (status lifecycle below) |
| `exercises/`, `workouts/`, `mealplans/` | Coach library templates |
| `media/{id}` | Images/videos uploaded to Cloud Storage |
| `conversations/{id}` | Chat threads; subcollection `messages` |

**Custom request status lifecycle:**
`PENDING_PAYMENT` → `DIAGNOSTIC` → AI generation by coach → `COMPLETED`

**Real-time updates:** Use `onSnapshot` listeners throughout — avoid one-time `getDoc` for data that should stay live.

**Storage rules:** Non-admin uploads capped at 50MB; only images/videos allowed; delete restricted to admins.

## AI Integration

`the-one/components/AICourseGenerator.tsx` calls Gemini 2.5 Pro (initialized in `firebase.ts` as `aiModel`) with a structured prompt expecting JSON `WeekProgram[]` output. The `jsonrepair` library handles malformed JSON from the model before parsing.

The `GEMINI_API_KEY` env var must be set in `the-one/.env` — Vite exposes it as `process.env.GEMINI_API_KEY`.

## Key Patterns

- **Tailwind CSS** is loaded via CDN in `index.html` — no PostCSS/build-time processing.
- **FCM** is lazy-loaded (`getMessagingInstance()`) and only available on HTTPS; service worker is at `the-one/public/firebase-messaging-sw.js`.
- **Exercise formats:** `REGULAR`, `EMOM`, `SUPER_SET`, `CIRCUIT`, `DROP_SET`, `AMRAP`, `FOR_TIME`, `HIIT`, `CARDIO`, `MAX_EFFORT` — all defined in `types.ts`.
- **`constants.tsx`** holds mock data, discipline lists, and default templates used across components.
