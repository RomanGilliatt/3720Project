# TigerTix

**Link to video:**
- https://www.loom.com/share/e90d70ec97ea4d28a87dc3d2e5614031

**Project Overview**
- TigerTix is a campus events ticketing demo that demonstrates a React frontend communicating with Node/Express microservices (events, authentication, admin and an LLM-driven booking helper). The project was built for instructional/demo purposes and includes automated tests for both frontend and backend components.
- Key features: event listing, authenticated ticket purchase, admin event management, and an LLM-driven natural-language booking assistant.

**Tech Stack**
- **Frontend:** React, React Testing Library, Jest
- **Backend:** Node.js, Express
- **Database:** SQLite
- **LLM Integration:** LLM API client

**Architecture Summary**
- **Microservices:**
	- `frontend/` - React single-page app
	- `backend/client-service/` - events listing, purchase endpoints
	- `backend/admin-service/` - admin endpoints to create/delete events
	- `backend/authentication/` - login, logout, `/me` endpoint and JWT middleware
	- `backend/llm-driven-booking/` - natural language booking/parse service
	- `backend/shared-db/` - `init.sql` and shared SQLite file used by services in development
- **Data Flow:**
	1. Frontend fetches events from `client-service` and shows them to users.
	2. Users authenticate via `authentication` service. Frontend calls `/me` to determine login state.
	3. Authenticated users call purchase endpoints on `client-service` to buy tickets.
	4. Admins use `admin-service` to create or delete events (writes to the shared DB).
	5. The `llm-driven-booking` service receives natural-language text (or voice->text) and returns a parsed booking proposal. The frontend can then confirm and ask `client-service` to perform the purchase.

**Installation & Setup**
Prerequisites:
- Node.js and `npm`
- Git

Quick start
1. Clone the repo:
	 - `git clone <repo-url>`
	 - `cd 3720Project`
2. Install dependencies for each service. From the repo root run:
	 - `cd frontend && npm install`
	 - `cd ..\backend\client-service && npm install`
	 - `cd ..\admin-service && npm install`
	 - `cd ..\authentication && npm install`
	 - `cd ..\llm-driven-booking && npm install`
3. Initialize the shared SQLite DB:
	 - `cd backend/shared-db` and run the SQL in `init.sql` with your SQLite client, or let services create/open the DB file automatically.
4. Start services (each in its own terminal):
	 - Frontend: `cd frontend && npm start`
	 - Client service: `cd backend/client-service && npm start`
	 - Authentication: `cd backend/authentication && npm start`
	 - Admin service: `cd backend/admin-service && npm start`
	 - LLM booking: `cd backend/llm-driven-booking && npm start`

**Environment Variables Setup**
Create `.env` files per service (examples below).

**Backend**

**Client-service microservice**
- REACT_APP_ADMIN_URL
- REACT_APP_AUTH_URL
- REACT_APP_CLIENT_URL
- REACT_APP_LLM_URL

**Admin-service microservice**
- REACT_APP_ADMIN_URL
- REACT_APP_AUTH_URL
- REACT_APP_CLIENT_URL
- REACT_APP_LLM_URL

**Authentication microservice**
- REACT_APP_ADMIN_URL
- REACT_APP_AUTH_URL
- REACT_APP_CLIENT_URL
- REACT_APP_LLM_URL
- JWT_SECRET
- NODE_ENV


**LLM-driven-booking microservice**
- REACT_APP_ADMIN_URL
- REACT_APP_AUTH_URL
- REACT_APP_CLIENT_URL
- REACT_APP_LLM_URL
- GROQ_API_KEY

**Frontend**
- REACT_APP_ADMIN_URL
- REACT_APP_AUTH_URL
- REACT_APP_CLIENT_URL
- REACT_APP_LLM_URL

**How to run regression tests**
- Frontend unit/integration tests:
	- From `frontend/` run:
		```powershell
		cd frontend
		npm test
		```

- Backend tests:
	- `cd backend/client-service && npm test`
	- `cd backend/admin-service && npm test`
	- `cd backend/authentication && npm test`
	- `cd backend/llm-driven-booking && npm test`

**Team & Roles**
- **Team members:** Roman Gilliatt, Walker McCollum
- **Instructor:** Dr. Julian Brinkley
- **TAs:** Colt Doster, Atik Enam
- **Roles:**
	- Roman Gilliatt - Scrum Master, Developer, QA
	- Walker McCollum - Product Owner, Developer, QA 

**License**
- MIT

