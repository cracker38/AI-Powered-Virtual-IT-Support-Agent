AI-Powered Virtual IT Support Agent
===================================

This project implements an AI-powered virtual IT support agent for CYPADI Ltd. It provides
chat-based IT support, automated troubleshooting, password reset workflows, ticket escalation,
knowledge base management, and analytics.

## High-Level Architecture

- **Backend**: Python FastAPI application exposing REST APIs for:
  - Authentication & authorization (JWT, role-based access control).
  - Chat & conversation management (NLP placeholder for now).
  - Knowledge base CRUD.
  - Ticket creation & escalation.
  - Basic analytics endpoints.
- **Frontend**: React + TypeScript single-page application for:
  - End-user chat interface.
  - Admin / Super Admin dashboards.
  - Knowledge base and user & role management UIs.

## Default Super Admin

On first startup, the backend automatically creates a **Super Admin** user if it does not exist:

- Email: `ange@gmail.com`
- Password: `Ange@123`
- Role: `super_admin`

Change this password immediately in production environments.

## Backend – Local Development

1. Create and activate a virtual environment (optional but recommended).
2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Start the backend API:

```bash
uvicorn backend.app.main:app --reload
```

The API will be available on `http://localhost:8000`.

## Frontend – Local Development

1. Install Node.js (LTS) and npm.
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Start the dev server:

```bash
npm run dev
```

The frontend will be available on the port reported by Vite (typically `http://localhost:5173`).

## Environment Variables

Create a `.env` file at the project root (or configure environment variables for your system) with at least:

- `DATABASE_URL` – SQLAlchemy URL, e.g. `sqlite:///./data.db` (default is used if omitted).
- `SECRET_KEY` – JWT signing key (a long random string).
- `ACCESS_TOKEN_EXPIRE_MINUTES` – Access token lifetime in minutes (default: 60).

## Database Migrations

For simplicity, the initial version uses SQLAlchemy ORM with automatic table creation on startup.
You can integrate Alembic or another migration tool later.

## Security Notice

The default super admin credentials are **only for initial setup and testing**.
Always:

- Change the default password before production.
- Use HTTPS in production.
- Restrict access to administrative functions via RBAC.

