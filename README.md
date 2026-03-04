# CYPADI Virtual IT Support Agent

End-to-end implementation of a multilingual AI-powered IT support assistant for CYPADI Ltd.

## Stack

- Backend: FastAPI (Python)
- Frontend: React + Vite (TypeScript)
- Database: MySQL
- NLP: Hugging Face Transformers (stubbed; ready for real models)

## Running locally (Docker)

```bash
docker-compose up --build
```

- Backend API: `http://localhost:8000`
- Frontend UI: `http://localhost:3000`

## Backend development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend development

```bash
cd frontend
npm install
npm run dev
```

## Next steps

- Replace placeholder NLP with fine-tuned multilingual models.
- Wire Active Directory, ticketing, and monitoring integrations into workflow endpoints.
- Harden security (JWT validation, real RBAC, audit log viewers).

