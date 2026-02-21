"""
TalentSecure AI — Real-Time Proctoring Pipeline
=================================================
Orchestrates the full frame-analysis workflow:

    WebCam Frame (BGR)
         │
         ▼
    ┌──────────────────────┐
    │  1. PREPROCESSING    │  → grayscale, median filter, CLAHE, threshold
    └──────────┬───────────┘
               │
         ┌─────┴─────┐
         ▼           ▼
    ┌──────────┐ ┌──────────────┐
    │ 2. GLCM  │ │  Resize 224  │
    │ Features │ │  for CNN     │
    └────┬─────┘ └──────┬───────┘
         │              │
         └──────┬───────┘
                ▼
    ┌──────────────────────┐
    │  3. CNN CLASSIFIER   │  → { label, confidence, probabilities }
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  4. ALERT DISPATCH   │  → HTTP POST to Node.js (if anomaly)
    └──────────────────────┘

The pipeline exposes two public functions:

  • ``analyze_frame``   — one-shot analysis for a single base64-encoded frame
  • ``start_webcam_loop`` — blocking loop that captures from a local camera
"""

import asyncio
import base64
import time
import cv2
import numpy as np
from dataclasses import dataclass, field

from pipeline.preprocessing import preprocess_frame, PreprocessedFrame
from pipeline.glcm_features import extract_glcm_features, extract_glcm_feature_vector, GLCMFeatures
from pipeline.cnn_classifier import classify_frame, get_model, IMG_HEIGHT, IMG_WIDTH, CLASS_NAMES
from pipeline.alert_dispatcher import send_alert, AlertPayload, CNN_TO_VIOLATION_TYPE


# ── Public data container ─────────────────────────────────────────────────────

@dataclass
class AnalysisResult:
    """Complete output of one pipeline invocation."""
    label: str
    confidence: float
    class_index: int
    probabilities: dict[str, float]
    is_anomaly: bool
    glcm: dict[str, float]
    alert_sent: bool = False
    alert_response: dict = field(default_factory=dict)
    processing_time_ms: float = 0.0


# ── Configuration ─────────────────────────────────────────────────────────────

CONFIDENCE_THRESHOLD = 0.55  # Minimum CNN softmax confidence to fire an alert
ALERT_COOLDOWN_SEC = 5.0     # Minimum seconds between consecutive alerts


# ── One-shot frame analysis ───────────────────────────────────────────────────

async def analyze_frame(
    frame_bgr: np.ndarray,
    *,
    student_id: str | None = None,
    exam_id: str | None = None,
    send_alert_on_anomaly: bool = True,
    confidence_threshold: float = CONFIDENCE_THRESHOLD,
) -> AnalysisResult:
    """
    Run the full pipeline on a single BGR video frame.

    Parameters
    ----------
    frame_bgr : np.ndarray
        Raw BGR frame from the webcam (any resolution).
    student_id, exam_id : str | None
        If provided AND an anomaly is detected, an HTTP alert is dispatched
        to the Node.js backend.
    send_alert_on_anomaly : bool
        Set to ``False`` to skip the HTTP POST (useful for dry-run / testing).
    confidence_threshold : float
        Minimum softmax probability for the anomaly class before an alert fires.

    Returns
    -------
    AnalysisResult
    """
    t0 = time.perf_counter()

    # ── Step 1: Preprocessing ────────────────────────────────────────────
    preprocessed: PreprocessedFrame = preprocess_frame(frame_bgr)

    # ── Step 2: GLCM feature extraction ──────────────────────────────────
    glcm_feats: GLCMFeatures = extract_glcm_features(preprocessed.equalized)
    glcm_vector = np.array(
        [glcm_feats.contrast, glcm_feats.energy, glcm_feats.entropy],
        dtype=np.float32,
    )

    # ── Step 3: CNN classification ───────────────────────────────────────
    gray_224 = cv2.resize(preprocessed.equalized, (IMG_WIDTH, IMG_HEIGHT))
    prediction = classify_frame(gray_224, glcm_vector)

    label: str = prediction["label"]
    confidence: float = prediction["confidence"]
    is_anomaly = label != "normal" and confidence >= confidence_threshold

    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    result = AnalysisResult(
        label=label,
        confidence=confidence,
        class_index=prediction["class_index"],
        probabilities=prediction["probabilities"],
        is_anomaly=is_anomaly,
        glcm={
            "contrast": glcm_feats.contrast,
            "energy": glcm_feats.energy,
            "entropy": glcm_feats.entropy,
        },
        processing_time_ms=round(elapsed_ms, 2),
    )

    # ── Step 4: Alert dispatch (if anomaly) ──────────────────────────────
    if is_anomaly and send_alert_on_anomaly and student_id and exam_id:
        violation = CNN_TO_VIOLATION_TYPE.get(label, label)
        alert = AlertPayload(
            student_id=student_id,
            exam_id=exam_id,
            violation_type=violation,
            risk_score=round(confidence * 100, 2),
        )
        result.alert_response = await send_alert(alert)
        result.alert_sent = True

    return result


# ── Base64 convenience wrapper ────────────────────────────────────────────────

async def analyze_base64_frame(
    b64_image: str,
    **kwargs,
) -> AnalysisResult:
    """
    Decode a base64 (or data-URL) encoded image and run the pipeline.
    Accepts raw base64 or ``data:image/...;base64,...`` format.
    """
    if "," in b64_image:
        b64_image = b64_image.split(",", 1)[1]

    img_bytes = base64.b64decode(b64_image)
    nparr = np.frombuffer(img_bytes, np.uint8)
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame_bgr is None:
        raise ValueError("Could not decode the provided image")

    return await analyze_frame(frame_bgr, **kwargs)


# ── Local webcam loop (for standalone / demo use) ─────────────────────────────

async def start_webcam_loop(
    student_id: str,
    exam_id: str,
    camera_index: int = 0,
    frame_interval: float = 2.0,
):
    """
    Capture frames from a local webcam in a loop and run the pipeline
    on each frame.  Press 'q' in the OpenCV window to stop.

    Parameters
    ----------
    student_id, exam_id : str
        Identifiers forwarded to the alert dispatcher.
    camera_index : int
        OpenCV VideoCapture device index (0 = default webcam).
    frame_interval : float
        Seconds between analyses (to limit CPU / GPU load).
    """
    # Warm up the model
    get_model()

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open camera {camera_index}")

    print(f"[Pipeline] Webcam loop started — analysing every {frame_interval}s")
    print(f"           student_id={student_id}  exam_id={exam_id}")
    print("           Press 'q' in the OpenCV window to stop.\n")

    last_alert_time = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("[Pipeline] Failed to read frame — retrying…")
                await asyncio.sleep(0.5)
                continue

            # Throttle: only fire an alert if cooldown has elapsed
            now = time.time()
            can_alert = (now - last_alert_time) >= ALERT_COOLDOWN_SEC

            result = await analyze_frame(
                frame,
                student_id=student_id,
                exam_id=exam_id,
                send_alert_on_anomaly=can_alert,
            )

            if result.alert_sent:
                last_alert_time = now

            # Draw overlay on frame for visual debugging
            _draw_overlay(frame, result)
            cv2.imshow("TalentSecure Proctoring", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

            await asyncio.sleep(frame_interval)
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[Pipeline] Webcam loop stopped.")


def _draw_overlay(frame: np.ndarray, result: AnalysisResult):
    """Draw classification result as a HUD overlay on the frame."""
    colour = (0, 255, 0) if not result.is_anomaly else (0, 0, 255)
    text = f"{result.label} ({result.confidence:.0%})"
    cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, colour, 2)
    cv2.putText(
        frame,
        f"GLCM  C={result.glcm['contrast']:.1f}  E={result.glcm['energy']:.3f}  H={result.glcm['entropy']:.2f}",
        (10, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (200, 200, 200),
        1,
    )
    if result.alert_sent:
        cv2.putText(frame, "ALERT SENT", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
