# TalentSecure-AI Tech Stack

This document outlines the primary technologies, frameworks, and tools used in the TalentSecure-AI application, organized by major components.

---

## 1. Frontend (Client)
- **Framework:** React (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, PostCSS
- **Testing:** Playwright (E2E)
- **Package Manager:** npm

### Key Files/Folders
- `client/src/` — React source code
- `client/public/` — Static assets
- `client/playwright.config.ts` — Playwright configuration

---

## 2. Backend (Server)
- **Languages:** TypeScript, JavaScript
- **Database ORM:** Prisma
- **Database:** (Not specified, but Prisma is used; likely PostgreSQL or MySQL)
- **API:** Node.js (Express or custom, details in `server/`)
- **Testing:** Custom scripts, TypeScript
- **Package Manager:** npm

### Key Files/Folders
- `server/src/` — Server source code
- `prisma/schema.prisma` — Prisma schema
- `prisma/migrations/` — Database migrations

---

## 3. AI Engine
- **Language:** Python
- **Frameworks/Libraries:**
  - Custom pipeline modules (see `ai-engine/pipeline/`)
  - Machine Learning: Likely uses libraries such as TensorFlow, PyTorch, scikit-learn (check `requirements.txt`)
- **API:** FastAPI or Flask (not specified, check `main.py`)
- **Package Manager:** pip

### Key Files/Folders
- `ai-engine/main.py` — AI engine entry point
- `ai-engine/pipeline/` — ML pipeline modules
- `ai-engine/requirements.txt` — Python dependencies

---

## 4. DevOps & Infrastructure
- **Containerization:** Docker (multi-service setup)
- **Orchestration:** Docker Compose (`docker-compose.yml`)
- **Web Server/Proxy:** Nginx (`docker/nginx.conf`)

### Key Files/Folders
- `docker/` — Dockerfiles and Nginx config
- `docker-compose.yml` — Service orchestration

---

## 5. Miscellaneous
- **Documentation:** Markdown files (`README.md`, `SAAS_ROADMAP.md`)
- **Scripts:** Various migration, seed, and utility scripts in `prisma/`, `server/scripts/`, etc.

---

## 6. Project Structure Overview
- `client/` — Frontend (React)
- `server/` — Backend (Node.js/TypeScript)
- `ai-engine/` — AI/ML Engine (Python)
- `prisma/` — Database schema and migrations
- `docker/` — Containerization and deployment

---

## 7. Notable Dependencies
- **Frontend:** React, Vite, Tailwind CSS, Playwright
- **Backend:** Prisma, TypeScript, Node.js
- **AI Engine:** Python, ML libraries (see `requirements.txt`)
- **DevOps:** Docker, Docker Compose, Nginx

---

*For more details, refer to the respective README files and configuration files in each directory.*

---

# TalentSecure – Container Overview

| Container Name         | Technology Stack                                                      | Default Port           | Role in System                | Detailed Usage                                                                                       |
|-----------------------|-----------------------------------------------------------------------|------------------------|-------------------------------|------------------------------------------------------------------------------------------------------|
| talentsecure-ai       | Python (FastAPI) / Node.js / AI Framework (LangChain, Transformers)   | 8000 / 3000 (config)   | Main Application / AI Service | - Exposes REST APIs<br>- Handles business logic<br>- Integrates LLMs or AI models<br>- Connects to Postgres, Redis & MinIO<br>- Auth, validation, processing |
| talentsecure-postgres | PostgreSQL 16 (Alpine Linux)                                         | 5432                   | Relational Database           | - Stores structured data (users, roles, metadata)<br>- Transaction management<br>- Audit logs<br>- Supports joins, indexing, constraints |
| talentsecure-redis    | Redis 7 (Alpine Linux)                                               | 6379                   | In-Memory Cache / Queue       | - Caching API responses<br>- Session management<br>- Rate limiting<br>- Temporary tokens<br>- Background job queues |
| talentsecure-minio    | MinIO (S3-compatible Object Storage)                                 | 9000 (API), 9001 (UI)  | File / Object Storage         | - Stores documents, PDFs, images<br>- AI model artifacts<br>- Uploads & generated files<br>- S3-compatible API |
