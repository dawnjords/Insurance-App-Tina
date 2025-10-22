# Vehicle Insurance Chatbot

A generative-AI powered chatbot (frontend + backend) that discusses a user's vehicle and recommends the best insurance cover type. The frontend is built with Vite and the backend uses Node.js + Express. The backend integrates with Google's Gemini generative AI to produce recommendations. The app is containerized with Docker into two containers (frontend and backend).

## Project structure

- Client/ — Vite frontend
- Server/ — Node.js + Express backend (Gemini integration)
- docker-compose.yml — Compose file to run both containers together (project root)

## Features

- Conversational UI to collect vehicle details (type, age, usage, value, etc.)
- AI-driven analysis using Gemini to recommend an insurance cover type
- Structured recommendation output (cover type + rationale)
- Containerized: separate Docker containers for frontend and backend

## Tech stack

- Frontend: Vite (React or your chosen framework)
- Backend: Node.js, Express
- Generative AI: Google Gemini (via @google/generative-ai or your chosen SDK)
- Containerization: Docker, Docker Compose

## Environment

Create a `.env` file inside the Server/ folder with secrets and configuration. Example:

```env
# Server/.env
GOOGLE_API_KEY=your_api_key_here
PORT=3000
# any other credentials or config your server requires
```

Do not commit credentials or service-account keys to source control. Use a secrets manager for production.

## Local development

1. Install dependencies

- Backend (Windows PowerShell / CMD):

```powershell
cd Server
npm install
```

- Frontend:

```powershell
cd Client
npm install
```

2. Run locally

- Backend:

```powershell
cd Server
npm run start    # or: node index.js / npm run dev depending on your setup
```

- Frontend (Vite):

```powershell
cd Client
npm run dev
```

Vite typically serves at http://localhost:5173 and the backend at http://localhost:4000 (adjust as configured).

## API (high-level contract)

- POST /api/chat
  - Request: { message: string, sessionId?: string, context?: object }
  - Response: { reply: string, recommendation?: { coverType: string, rationale: string } }

Adapt endpoints and payloads to match the implementation in Server/.

## Docker (two-container setup)

Example docker-compose.yml (place at project root):

```yaml
version: "3.8"
services:
  backend:
    build:
      context: ./Server
    env_file:
      - ./Server/.env
    ports:
      - "3000:3000"
  frontend:
    build:
      context: ./Client
    ports:
      - "5173:5173"
```

Each service should include a Dockerfile:

- Server/Dockerfile: install dependencies, copy code, expose PORT, and start the Express server.
- Client/Dockerfile: install dependencies and either run the Vite dev server (for development) or build and serve a production build.

Example quick commands to build & run:

```powershell
# from project root
docker-compose build
docker-compose up
```

## Implementation notes & best practices

- Use prompt templates and a few-shot approach to steer Gemini toward producing consistent, structured recommendations.
- Validate and normalize user-provided vehicle data before sending to the model.
- Avoid logging secrets or raw API keys. Log minimal request/response data for debugging.
- Consider caching or rate-limiting model requests if usage grows.
- Add unit and integration tests for the backend API and model integration.

## Where to look

- Backend entry & routes: Server/
- Frontend app: Client/
- Backend dependencies: Server/package.json
