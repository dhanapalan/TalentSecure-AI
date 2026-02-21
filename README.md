# TalentSecure AI

> Data-driven campus recruitment platform with AI-powered smart segmentation and secure proctored assessments.

## Overview

TalentSecure AI strategically identifies top talent by matching student profiles with specific technical and behavioral role requirements. It ensures absolute assessment integrity through advanced remote proctoring technologies.

### Core Capabilities

| Module | Description |
|--------|-------------|
| **Smart Segmentation** | AI-driven clustering and ranking of student profiles based on skills, academics, and behavioral traits |
| **Role Matching Engine** | Maps candidate profiles to technical and behavioral competencies required for each role |
| **Secure Assessment** | Delivers evaluations in a locked-down, proctored environment |
| **Remote Proctoring** | Real-time face verification, browser lockdown, and automated cheating detection |
| **Analytics Dashboard** | Recruitment funnel analytics, talent pool insights, and hiring metrics |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript, Tailwind CSS, Vite |
| Backend API | Node.js + Express + TypeScript |
| AI/ML Engine | Python 3.11, scikit-learn, TensorFlow, FastAPI |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis, BullMQ |
| Proctoring | WebRTC, TensorFlow.js (face detection), Custom browser lockdown |
| Auth | JWT + OAuth 2.0 (Google, Microsoft) |
| Storage | AWS S3 / MinIO |
| Deployment | Docker, Docker Compose, GitHub Actions CI/CD |

## Project Structure

```
TalentSecure-AI/
├── client/                  # React frontend
├── server/                  # Node.js Express API
├── ai-engine/               # Python ML microservice
├── proctoring/              # Proctoring engine (WebRTC + TF.js)
├── prisma/                  # Database schema & migrations
├── docker/                  # Docker configurations
├── docs/                    # Architecture & API documentation
└── scripts/                 # Utility & setup scripts
```

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/talentsecure-ai.git
cd TalentSecure-AI
npm install

# 2. Setup environment
cp .env.example .env

# 3. Start database & services
docker-compose up -d

# 4. Run migrations
npx prisma migrate dev

# 5. Start development
npm run dev
```

## License

Proprietary — © 2026 TalentSecure AI. All rights reserved.
