"""
TalentSecure AI — Alert Dispatcher
====================================
Sends violation alerts to the Node.js backend via HTTP POST.

Endpoint called:  POST  {BACKEND_URL}/api/cheating-logs
Authenticated with the ``x-api-key`` header.
"""

import os
import httpx
from dataclasses import dataclass

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5050")
AI_ENGINE_API_KEY = os.getenv("AI_ENGINE_API_KEY", "dev-ai-engine-key")

# Reusable async client (connection pooling)
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=BACKEND_URL,
            timeout=10.0,
            headers={"x-api-key": AI_ENGINE_API_KEY},
        )
    return _client


@dataclass
class AlertPayload:
    student_id: str
    exam_id: str
    violation_type: str
    risk_score: float
    screenshot_url: str | None = None


# ── Mapping from CNN class names to DB violation_type enum values ─────────────
CNN_TO_VIOLATION_TYPE = {
    "multiple_faces": "multiple_faces",
    "mobile_detected": "face_not_detected",   # closest DB enum for phone
    "suspicious": "face_mismatch",             # generic suspicious behaviour
}


async def send_alert(payload: AlertPayload) -> dict:
    """
    POST the cheating log to the Node.js API.

    Returns the parsed JSON response body, or an error dict on failure.
    """
    client = _get_client()

    body = {
        "student_id": payload.student_id,
        "exam_id": payload.exam_id,
        "violation_type": payload.violation_type,
        "risk_score": payload.risk_score,
    }
    if payload.screenshot_url:
        body["screenshot_url"] = payload.screenshot_url

    try:
        resp = await client.post("/api/cheating-logs", json=body)
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        return {"error": True, "status": e.response.status_code, "detail": e.response.text}
    except httpx.RequestError as e:
        return {"error": True, "detail": str(e)}
