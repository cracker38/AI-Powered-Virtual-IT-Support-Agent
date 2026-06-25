<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
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

>>>>>>> fa9482b7b13a6cfd0273be4c4406ec75a2be3186
