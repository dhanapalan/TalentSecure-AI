"""
Proctoring Router
==================
FastAPI endpoints that expose the full CV proctoring pipeline.

POST /api/proctoring/analyze      — Full pipeline (preprocess → GLCM → CNN → alert)
POST /api/proctoring/preprocess   — Preprocessing stage only (returns base64 artefacts)
POST /api/proctoring/glcm         — GLCM feature extraction only
"""

import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from pipeline.preprocessing import preprocess_frame
from pipeline.glcm_features import extract_glcm_features
from pipeline.proctoring import analyze_base64_frame

router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Payload sent by the client (or proctoring agent) for every captured frame."""
    image: str = Field(..., description="Base64-encoded webcam frame (JPEG or PNG)")
    student_id: Optional[str] = Field(None, description="UUID of the student being proctored")
    exam_id: Optional[str] = Field(None, description="UUID of the exam session")
    confidence_threshold: float = Field(0.55, ge=0.0, le=1.0)


class AnalyzeResponse(BaseModel):
    label: str
    confidence: float
    class_index: int
    probabilities: dict[str, float]
    is_anomaly: bool
    glcm: dict[str, float]
    alert_sent: bool
    processing_time_ms: float


class PreprocessRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded webcam frame")


class PreprocessResponse(BaseModel):
    grayscale: str      # base64 PNG
    denoised: str       # base64 PNG
    equalized: str      # base64 PNG
    thresholded: str    # base64 PNG
    width: int
    height: int


class GLCMRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded webcam frame")


class GLCMResponse(BaseModel):
    contrast: float
    energy: float
    entropy: float


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    """
    **Full proctoring pipeline.**

    1. Decode the base64 image
    2. Preprocess (grayscale → median filter → CLAHE → adaptive threshold)
    3. Extract GLCM features (contrast, energy, entropy)
    4. Run the CNN classifier (normal / multiple_faces / mobile_detected / suspicious)
    5. If an anomaly is detected and ``student_id`` + ``exam_id`` are provided,
       fire an HTTP POST to the Node.js backend at ``/api/cheating-logs``

    The response includes the classification result, GLCM features,
    and whether an alert was dispatched.
    """
    try:
        result = await analyze_base64_frame(
            req.image,
            student_id=req.student_id,
            exam_id=req.exam_id,
            confidence_threshold=req.confidence_threshold,
        )
        return AnalyzeResponse(
            label=result.label,
            confidence=result.confidence,
            class_index=result.class_index,
            probabilities=result.probabilities,
            is_anomaly=result.is_anomaly,
            glcm=result.glcm,
            alert_sent=result.alert_sent,
            processing_time_ms=result.processing_time_ms,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")


@router.post("/preprocess", response_model=PreprocessResponse)
async def preprocess_only(req: PreprocessRequest):
    """
    Run **only** the preprocessing stage and return every intermediate
    image as a base64-encoded PNG.  Useful for debugging / visualization.
    """
    try:
        frame_bgr = _decode_b64_image(req.image)
        pp = preprocess_frame(frame_bgr)
        h, w = pp.grayscale.shape[:2]

        return PreprocessResponse(
            grayscale=_encode_to_b64_png(pp.grayscale),
            denoised=_encode_to_b64_png(pp.denoised),
            equalized=_encode_to_b64_png(pp.equalized),
            thresholded=_encode_to_b64_png(pp.thresholded),
            width=w,
            height=h,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/glcm", response_model=GLCMResponse)
async def glcm_only(req: GLCMRequest):
    """
    Run preprocessing → GLCM extraction and return the three Haralick
    texture descriptors (contrast, energy, entropy).
    """
    try:
        frame_bgr = _decode_b64_image(req.image)
        pp = preprocess_frame(frame_bgr)
        feats = extract_glcm_features(pp.equalized)

        return GLCMResponse(
            contrast=feats.contrast,
            energy=feats.energy,
            entropy=feats.entropy,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _decode_b64_image(b64: str) -> np.ndarray:
    """Decode base64 (or data-URL) string → BGR numpy array."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    img_bytes = base64.b64decode(b64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode the provided image")
    return frame


def _encode_to_b64_png(gray: np.ndarray) -> str:
    """Encode a grayscale numpy array → base64 PNG string."""
    _, buf = cv2.imencode(".png", gray)
    return base64.b64encode(buf.tobytes()).decode("ascii")
