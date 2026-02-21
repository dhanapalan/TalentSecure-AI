"""
Face Verification Router
Real-time face detection and matching for proctoring integrity.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import base64
import io
import numpy as np

router = APIRouter()


class VerifyRequest(BaseModel):
    referenceUrl: str
    snapshot: str  # Base64-encoded image
    threshold: float = 0.85


class VerifyResponse(BaseModel):
    match: bool
    confidence: float
    faces_detected: int
    message: Optional[str] = None


@router.post("/verify", response_model=VerifyResponse)
def verify_face(req: VerifyRequest):
    """
    Verify that the face in the snapshot matches the reference photo.
    Uses face_recognition library (dlib-based) for encoding and comparison.
    
    In production, this decodes the base64 snapshot, detects faces,
    and compares encodings against the reference.
    
    This is a scaffold — full implementation requires:
    1. Download reference image from URL
    2. Decode base64 snapshot
    3. Detect faces in both images
    4. Compare face encodings
    """
    try:
        # Decode snapshot
        if not req.snapshot:
            raise HTTPException(status_code=400, detail="No snapshot provided")

        # Remove data URL prefix if present
        snapshot_data = req.snapshot
        if "," in snapshot_data:
            snapshot_data = snapshot_data.split(",")[1]

        try:
            image_bytes = base64.b64decode(snapshot_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image")

        # --- Production Implementation ---
        # import face_recognition
        # from PIL import Image
        #
        # snapshot_image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        # snapshot_locations = face_recognition.face_locations(snapshot_image)
        # faces_detected = len(snapshot_locations)
        #
        # if faces_detected == 0:
        #     return VerifyResponse(match=False, confidence=0.0, faces_detected=0,
        #                           message="No face detected in snapshot")
        # if faces_detected > 1:
        #     return VerifyResponse(match=False, confidence=0.0, faces_detected=faces_detected,
        #                           message="Multiple faces detected")
        #
        # # Get encodings
        # snapshot_encoding = face_recognition.face_encodings(snapshot_image, snapshot_locations)[0]
        #
        # # Load and encode reference
        # import httpx
        # ref_response = httpx.get(req.referenceUrl)
        # ref_image = face_recognition.load_image_file(io.BytesIO(ref_response.content))
        # ref_encoding = face_recognition.face_encodings(ref_image)[0]
        #
        # # Compare
        # distance = face_recognition.face_distance([ref_encoding], snapshot_encoding)[0]
        # confidence = 1.0 - distance
        # match = confidence >= req.threshold

        # --- Scaffold response ---
        # For development, return a mock successful verification
        return VerifyResponse(
            match=True,
            confidence=0.92,
            faces_detected=1,
            message="Face verification scaffold — implement with face_recognition library",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face verification error: {str(e)}")


@router.post("/detect")
def detect_faces(snapshot: str):
    """
    Detect number of faces in a snapshot (for multi-face checking).
    """
    # Scaffold
    return {"faces_detected": 1, "locations": []}
