# TigerTix (3720Project)

**Project Overview**
- **Purpose:** TigerTix is a campus events ticketing demo that demonstrates a React frontend communicating with small Node/Express microservices (events, authentication, admin and an LLM-driven booking helper). The project was built for instructional/demo purposes and includes automated tests for both frontend and backend components.
- **Key features:** event listing, authenticated ticket purchase, admin event management, and an LLM-driven natural-language booking assistant (text + optional voice helpers).

**Tech Stack**
- **Frontend:** React (Create React App), React Testing Library, Jest
- **Backend:** Node.js, Express
- **Database:** SQLite (shared DB under `shared-db/init.sql`) — can be replaced with Supabase or another hosted DB
- **LLM Integration:** LLM API client (configurable via env vars) used by `llm-driven-booking` microservice
- **Other:** axios (HTTP client), jsonwebtoken (JWT auth), bcryptjs (password hashing), supertest (integration tests)

**Architecture Summary**
- **Microservices:**
	- `frontend/` — React single-page app
	- `backend/client-service/` — events listing, purchase endpoints
	- `backend/admin-service/` — admin endpoints to create/delete events
	- `backend/authentication/` — login, logout, `/me` endpoint and JWT middleware
	- `backend/llm-driven-booking/` — natural language booking/parse service (talks to LLM provider)
	- `backend/shared-db/` — `init.sql` and shared SQLite file used by services in development
- **High-level data flow:**
	1. Frontend fetches events from `client-service` and shows them to users.
	2. Users authenticate via `authentication` service (JWT cookies). Frontend calls `/me` to determine login state.
	3. Authenticated users call purchase endpoints on `client-service` to reserve/buy tickets.
	4. Admins use `admin-service` to create or delete events (writes to the shared DB).
	5. The `llm-driven-booking` service receives natural-language text (or voice->text) and returns a parsed booking proposal; the frontend can then confirm and ask `client-service` to perform the purchase.

**Installation & Setup**
Prerequisites:
- Node.js (v16+ recommended) and `npm`
- Git
- Optional: SQLite3 CLI if you need to inspect the DB

Quick start (development)
1. Clone the repo:
	 - `git clone <repo-url>`
	 - `cd 3720Project`
2. Install dependencies for each service. From the repo root run:
	 - `cd frontend && npm install`
	 - `cd ..\backend\client-service && npm install`
	 - `cd ..\admin-service && npm install`
	 - `cd ..\authentication && npm install`
	 - `cd ..\llm-driven-booking && npm install`
3. Initialize the shared SQLite DB (development):
	 - `cd backend/shared-db` and run the SQL in `init.sql` with your SQLite client, or let services create/open the DB file automatically.
4. Start services (each in its own terminal):
	 - Frontend: `cd frontend && npm start` (defaults to `http://localhost:3000`)
	 - Client service: `cd backend/client-service && npm start` (defaults to port `6001`)
	 - Authentication: `cd backend/authentication && npm start` (defaults to port `4000`)
	 - Admin service: `cd backend/admin-service && npm start` (defaults to port `5001`)
	 - LLM booking: `cd backend/llm-driven-booking && npm start` (defaults to port `7001`)

Note: The ports above reflect the values expected by the frontend (`App.js` calls `http://localhost:6001/api/events` and `http://localhost:4000/me`, and LLM calls `http://localhost:7001`). If you change ports, update the corresponding URLs or set environment variables as described next.

**Environment Variables**
Create `.env` files per service (examples below). Do NOT commit secrets.

- `backend/authentication/.env` (example):
	- `PORT=4000`
	- `JWT_SECRET=your_jwt_secret_here`
	- `DATABASE_URL=../shared-db/database.sqlite` (or full path)

- `backend/client-service/.env` (example):
	- `PORT=6001`
	- `DATABASE_URL=../shared-db/database.sqlite`

- `backend/admin-service/.env` (example):
	- `PORT=5001`
	- `DATABASE_URL=../shared-db/database.sqlite`

- `backend/llm-driven-booking/.env` (example):
	- `PORT=7001`
	- `LLM_PROVIDER=openai` (or your provider)
	- `LLM_API_KEY=sk-xxxx` (your provider key)

- `frontend/.env` (example):
	- `PORT=3000`
	- `REACT_APP_CLIENT_SERVICE_URL=http://localhost:6001`
	- `REACT_APP_AUTH_URL=http://localhost:4000`

**How to run regression tests**
- Frontend unit/integration tests (Jest + React Testing Library):
	- From `frontend/` run:
		```powershell
		cd frontend
		$env:CI='true'; npm test -- --watchAll=false
		```
	- During development you can run `npm test` (watch mode) from `frontend`.

- Backend tests (per service):
	- `cd backend/client-service && npm test`
	- `cd backend/admin-service && npm test`
	- `cd backend/authentication && npm test`
	- `cd backend/llm-driven-booking && npm test`

- Run all tests from repo root (Windows PowerShell example using `npm --prefix`):
	```powershell
	npm --prefix frontend test -- --watchAll=false
	npm --prefix backend/client-service test
	npm --prefix backend/admin-service test
	npm --prefix backend/authentication test
	npm --prefix backend/llm-driven-booking test
	```

**Tips when testing**
- The frontend test environment uses a manual axios mock and global mocks for Web Speech / Audio APIs. If you add tests that depend on those browser APIs, add appropriate mocks in `src/setupTests.js`.
- If tests fail due to network calls, ensure mocks are present for `/api/events`, `/me`, and any LLM endpoints.

**Team & Roles**
- **Team members:** (update to match your team)
	- **Team Lead / Repo Owner:** Roman Gilliatt
	- **Developer / Tester:** [Add names]
	- **Developer:** [Add names]
- **Instructor:** [Instructor Name]
- **TAs:** [TA Name 1], [TA Name 2]
- **Suggested roles:**
	- Frontend: UI & tests
	- Backend: microservices & DB
	- LLM: parsing integration & prompts
	- QA: write & run regression tests (unit + integration)

Please replace placeholders above with real names and roles for your team & course.

**License**
- This project does not include a `LICENSE` file by default. If you want a permissive, commonly-used license, you can add an MIT license. Example copy to add to a `LICENSE` file:

```
MIT License

Copyright (c) <year> <owner>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

[... full MIT text ...]
```

Replace `<year>` and `<owner>` appropriately. If your institution requires a different license, add that instead and commit `LICENSE`.

**Where to find code**
- Frontend: `frontend/src`
- Backend services: `backend/*`
- Shared DB SQL: `backend/shared-db/init.sql`

**Next steps / common improvements**
- Add a top-level script to run/start all services (e.g., a PowerShell script or `docker-compose`).
- Replace the simple SQLite dev DB with Supabase/Postgres for multi-developer workflows.
- Add Playwright or Cypress E2E tests for full booking flows.

If you want, I can also:
- Create a `LICENSE` file with MIT text and commit it.
- Add a simple `start-all` script or `docker-compose.yml` to bring up services together.
- Convert the test mocks to `msw` (Mock Service Worker) for clearer network-based tests.

---
Generated on: December 3, 2025
