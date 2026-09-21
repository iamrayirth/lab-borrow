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

## Quickstart for beginners

This section assumes no prior experience with this project — just a terminal and a bit of patience. If you
already know your way around Node/Docker projects, the condensed version is in [Getting started](#getting-started)
below.

### 1. Install the prerequisites

You need three things on your computer:

1. **Node.js** version 20 or newer — [download here](https://nodejs.org) (the installer includes `npm`).
   Check it worked: `node -v` should print `v20.x.x` or higher.
2. **Docker Desktop** — [download here](https://www.docker.com/products/docker-desktop/). This runs the
   PostgreSQL database for you in a container, so you don't have to install Postgres by hand. Make sure it's
   actually running (open the app) before continuing.
3. **Git** — usually already installed. Check with `git --version`.

### 2. Get the code and install dependencies

```bash
git clone <repo-url>
cd lab-borrow
npm install
```

`npm install` reads the root `package.json` and installs everything for **both** the backend and frontend in
one step (they're set up as npm workspaces).

### 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL container in the background, pre-configured with the username, password, and
database name the app expects. You can check it's running with `docker ps` — you should see a `postgres`
container listed.

### 4. Configure environment variables

```bash
cp .env.example backend/.env
```

This copies the example environment file into place. The defaults already match the database started in step
3, so you don't need to edit anything to get running locally — but you can open `backend/.env` and change the
`JWT_SECRET`/`ADMIN_JWT_SECRET` values if you want.

### 5. Set up and seed the database

```bash
npm run db:migrate    # creates all the tables (User, Component, Rental, etc.)
npm run db:seed       # adds a demo admin, two demo students, and four demo components
```

If `db:migrate` fails, the most common cause is Docker not actually running yet — give it a few seconds after
`docker compose up -d` and try again.

### 6. Run the app

```bash
npm run dev
```

This starts **both** servers at once: the backend API on port 4000 and the frontend on port 5173. Leave this
running in your terminal, then open **http://localhost:5173** in your browser.

### 7. Try the golden path yourself

Use the two seeded student accounts below (or register your own) to walk through the full workflow the app is
built around. Password for every seeded account is `Password123!`.

| Role    | Email                | 
| ------- | --------------------- |
| Student | alice@college.edu     |
| Student | bob@college.edu       |
| Admin   | admin@labborrow.dev   |

1. Open the site in one browser window and log in as **Alice**. Go to **My Components → + New listing** and
   create something (e.g. an ESP32 board).
2. Open a **second, separate browser window in private/incognito mode** (so it doesn't share Alice's login)
   and log in as **Bob**.
3. As Bob, go to **Browse**, search for the item Alice listed, open it, pick start/end dates, and click
   **Send request**. Notice the live price preview as you pick dates.
4. Switch back to Alice's window → **My Rentals → Requests on my items**. You'll see Bob's request with
   **Accept**/**Reject** buttons. Click **Accept** — the rental becomes **Active**.
5. Switch to Bob's window → **My Rentals → Requests I made**. Click **Request return**.
6. Switch back to Alice's window and click **Confirm return**. The rental is now **Completed**, and if you go
   back to **Browse**, the component shows **Available** again.

For the admin side: log out, go to **http://localhost:5173/admin/login**, and sign in with the admin account
above. You can view/disable users and listings from there — it's a completely separate login from the student
app.

### 8. Run the automated tests

```bash
npm test
```

What this does: it spins up a **second**, separate database (`labborrow_test`, configured in
`backend/.env.test` so it never touches your real seeded data), runs the real Prisma migrations against it,
then runs 32 tests that exercise the actual HTTP API end-to-end (using Supertest) against that database —
nothing is mocked. You'll see output like this when it's done:

```
Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
```

Those 32 tests cover the business rules the MVP depends on: registration/login, that you can't edit someone
else's component listing, that you can't rent your own component, that overlapping rental requests for the
same dates are rejected, the full accept → active → return-requested → completed lifecycle, and that a
student account is denied access to admin-only endpoints.

If a test run ever fails with a connection error, make sure Docker/Postgres is still running (`docker ps`).

### Troubleshooting

| Problem | Fix |
| --- | --- |
| `docker compose up -d` errors out | Make sure Docker Desktop is open and running first. |
| `npm run db:migrate` fails to connect | Wait a few seconds after starting Docker, then retry — Postgres takes a moment to initialize. |
| Port 4000 or 5173 already in use | Something else on your machine is using that port; stop it, or change `PORT` in `backend/.env` / the `server.port` in `frontend/vite.config.ts`. |
| Login doesn't seem to work / redirects to login | Make sure you're visiting the app through `http://localhost:5173` (not `4000`) — that's the Vite dev server that proxies API calls and keeps cookies working. |

---

## Getting started

The condensed version, if you've done this kind of setup before. Prerequisites: Node.js 20+, Docker (for
Postgres) — or any local PostgreSQL 16 instance.

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
