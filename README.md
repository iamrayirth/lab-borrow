# Lab Borrow

A student-to-student platform for renting unused electrical/electronic components (ESP32s, sensors, motor
drivers, dev boards, etc.) for college projects. This is a deliberately scoped **MVP**: it exists to prove out
one workflow end-to-end, not to be a full commercial marketplace.

```
List a component → Search → Request rental → Owner accepts → Rental active
→ Renter requests return → Owner confirms → Component available again
```

## Tech stack

| Layer     | Tech                                                              |
| --------- | ------------------------------------------------------------------ |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS v4, React Router          |
| Backend   | Node.js, TypeScript, Express                                       |
| Database  | PostgreSQL, Prisma ORM                                             |
| Auth      | JWT in httpOnly cookies (separate cookie/session for admin)        |
| Storage   | Local disk (`backend/uploads/`), served statically — swappable later |
| Testing   | Jest + Supertest (backend), verified end-to-end with Playwright    |

Payment processing is **not implemented** in this MVP — rental pricing (daily rate, deposit, total) is
calculated and stored so a real payment integration can be added later without a schema change.

## Project structure

```
lab-borrow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # User, Component, ComponentImage, Rental, Report, Notification
│   │   ├── migrations/
│   │   └── seed.ts             # 1 admin + 2 students + 4 components
│   ├── src/
│   │   ├── modules/            # auth, users, components, rentals, admin, reports, notifications
│   │   │   └── <module>/       # <module>.routes.ts / .controller.ts / .service.ts / .schemas.ts
│   │   ├── middleware/         # auth, optionalAuth, upload, rateLimit, errorHandler
│   │   ├── database/           # prisma client singleton
│   │   ├── utils/               # AppError, jwt, cookies, validate, serialize
│   │   ├── app.ts
│   │   └── server.ts
│   └── tests/                  # auth, components, rentals, admin (32 tests)
├── frontend/
│   └── src/
│       ├── pages/               # one file per route, incl. pages/admin/*
│       ├── components/          # ComponentCard, RentalCard, Layout, ui/*
│       ├── context/             # AuthContext (students), AdminAuthContext
│       ├── services/            # one file per API resource (axios)
│       └── types/
├── docker-compose.yml           # PostgreSQL for local dev
└── .env.example
```

## Getting started

Prerequisites: Node.js 20+, Docker (for Postgres) — or any local PostgreSQL 16 instance.

```bash
git clone <repo-url>
cd lab-borrow
npm install                     # installs backend + frontend workspaces
docker compose up -d            # starts PostgreSQL on localhost:5432
cp .env.example backend/.env    # then edit JWT secrets if you like
npm run db:migrate              # applies the Prisma schema
npm run db:seed                 # creates demo admin + 2 students + 4 components
npm run dev                     # runs backend (:4000) and frontend (:5173) together
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/uploads` to the backend, so cookies work
without any CORS configuration in development.

Seeded accounts (password for all: `Password123!`):

| Role    | Email                  |
| ------- | ----------------------- |
| Admin   | admin@labborrow.dev      |
| Student | alice@college.edu        |
| Student | bob@college.edu          |

Admin UI is at `/admin/login` — it is a fully separate login/session from the student app.

### Running tests

```bash
npm test          # backend: 32 Jest + Supertest tests against a real Postgres test DB
```

The test suite creates its own `labborrow_test` database (see `backend/.env.test`) and runs actual Prisma
migrations against it — no mocking of the database layer. Coverage focuses on the MVP's core business rules:
registration/login, ownership checks on components, self-rental prevention, overlapping-rental prevention,
the full accept → active → return-requested → completed lifecycle, and admin access control (including that
students are denied admin routes).

## Design decisions worth knowing

- **Rental status machine.** The spec lists `PENDING → ACCEPTED → ACTIVE` as separate states. In this MVP,
  accepting a request moves it directly from `PENDING` to `ACTIVE` in one action (there's no separate "start
  rental" step in the UI), which matches the example workflow in the product brief. The `ACCEPTED` enum value
  is kept in the schema for forward compatibility but isn't used by the current flow.
- **Overlap prevention.** A new rental request is rejected (409) if its date range overlaps an existing
  `PENDING`, `ACTIVE`, or `RETURN_REQUESTED` rental for the same component. The check runs inside a
  `Serializable` Prisma transaction so two simultaneous requests for the same dates can't both succeed.
- **Soft deletion.** Deactivating a component (or an admin disabling one) sets `isActive: false` rather than
  deleting the row, so rental history stays intact. A component that's currently rented stays `RENTED` until
  the active rental completes, then flips to `AVAILABLE` or `INACTIVE` depending on whether the owner
  deactivated it in the meantime.
- **Two separate auth systems.** Students authenticate via `POST /api/auth/login` (cookie `token`); admins via
  `POST /api/admin/auth/login` (cookie `admin_token`, signed with a different secret). Every admin route is
  guarded server-side by `requireAdmin`, which checks `role === 'ADMIN'` against the database — a student
  token can never pass it.

## API overview

All endpoints are under `/api`. See `backend/src/app.ts` for the full router wiring.

```
POST   /api/auth/register            POST   /api/rentals
POST   /api/auth/login               GET    /api/rentals?role=renter|owner
POST   /api/auth/logout              GET    /api/rentals/:id
GET    /api/auth/me                  PATCH  /api/rentals/:id/status

GET    /api/components               GET    /api/profile
POST   /api/components               PATCH  /api/profile
GET    /api/components/:id           POST   /api/profile/image
PATCH  /api/components/:id
DELETE /api/components/:id           GET    /api/notifications
POST   /api/components/:id/images    PATCH  /api/notifications/:id/read

POST   /api/reports                  POST   /api/admin/auth/login
                                      GET    /api/admin/users
                                      PATCH  /api/admin/users/:id
                                      GET    /api/admin/components
                                      PATCH  /api/admin/components/:id
                                      GET    /api/admin/rentals
                                      GET    /api/admin/reports
```

## Environment variables

See `.env.example`. All are required except where noted:

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` / `ADMIN_JWT_SECRET` — separate signing secrets for student and admin sessions
- `CLIENT_ORIGIN` — used for CORS when not going through the Vite proxy
- `UPLOAD_DIR`, `MAX_UPLOAD_SIZE_MB` — local image storage settings
