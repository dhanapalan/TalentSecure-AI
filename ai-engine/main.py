"""
TalentSecure AI — ML / CV Engine (FastAPI)
===========================================
Endpoints:
  /health                        — Service health check
  /api/proctoring/analyze        — Analyse a single base64 frame (full pipeline)
  /api/proctoring/preprocess     — Return preprocessing artefacts only
  /api/proctoring/glcm           — Return GLCM features only
  /api/segmentation/*            — Student segmentation (clustering)
  /api/matching/*                — Role-student matching
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import segmentation, matching, proctoring


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm up the CNN model once at startup (not on first request)."""
    from pipeline.cnn_classifier import get_model
    get_model()
    print("[AI Engine] CNN model warmed up ✓")
    yield


app = FastAPI(
    title="TalentSecure AI Engine",
    description="ML / Computer-Vision microservice for proctoring, segmentation, and matching",
    version="2.0.0",
    lifespan=lifespan,
)

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5050")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[BACKEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(proctoring.router, prefix="/api/proctoring", tags=["Proctoring"])
app.include_router(segmentation.router, prefix="/api/segmentation", tags=["Segmentation"])
app.include_router(matching.router, prefix="/api/matching", tags=["Matching"])


@app.get("/health")
def health():
    return {"status": "healthy", "service": "TalentSecure AI Engine", "version": "2.0.0"}
