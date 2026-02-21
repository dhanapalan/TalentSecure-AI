"""
TalentSecure AI — Image Preprocessing Module
==============================================
Step 1 of the proctoring pipeline.

Operations performed on every incoming video frame:
  1. BGR → Grayscale conversion
  2. Median filter (salt-and-pepper noise removal, preserves edges)
  3. Adaptive thresholding (illumination-invariant segmentation)
  4. Optional: histogram equalization for contrast normalization
"""

import cv2
import numpy as np
from dataclasses import dataclass


@dataclass
class PreprocessedFrame:
    """Container for all intermediate representations of a single frame."""
    original: np.ndarray        # Raw BGR frame (H × W × 3)
    grayscale: np.ndarray       # Grayscale (H × W)
    denoised: np.ndarray        # After median filter (H × W)
    equalized: np.ndarray       # After histogram equalization (H × W)
    thresholded: np.ndarray     # After adaptive threshold (H × W, binary)


def preprocess_frame(
    frame: np.ndarray,
    *,
    median_ksize: int = 5,
    adaptive_block_size: int = 11,
    adaptive_c: int = 2,
) -> PreprocessedFrame:
    """
    Run the full preprocessing pipeline on a single BGR video frame.

    Parameters
    ----------
    frame : np.ndarray
        Raw BGR image captured from the webcam (H × W × 3, dtype=uint8).
    median_ksize : int
        Kernel size for the median filter. Must be odd (3, 5, 7 …).
        Larger values remove more noise but lose fine detail.
    adaptive_block_size : int
        Neighbourhood size for adaptive thresholding. Must be odd.
    adaptive_c : int
        Constant subtracted from the neighbourhood mean in adaptive threshold.

    Returns
    -------
    PreprocessedFrame
        Named container holding every intermediate image representation.
    """
    if frame is None or frame.size == 0:
        raise ValueError("Empty frame received")

    # ── 1. Colour-space conversion ────────────────────────────────────────────
    # OpenCV captures in BGR; convert to single-channel grayscale for all
    # downstream feature extraction (GLCM, thresholding, etc.)
    grayscale = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # ── 2. Median filter (noise removal) ──────────────────────────────────────
    # Median filter is preferred over Gaussian for proctoring because it
    # removes salt-and-pepper noise (common in webcams) while preserving
    # the sharp edges around faces and objects (phones, books, etc.).
    denoised = cv2.medianBlur(grayscale, median_ksize)

    # ── 3. Histogram equalization (contrast normalization) ────────────────────
    # CLAHE (Contrast Limited Adaptive Histogram Equalization) normalizes
    # brightness variations from different webcam setups / room lighting.
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    equalized = clahe.apply(denoised)

    # ── 4. Adaptive thresholding (binary segmentation) ────────────────────────
    # Adaptive threshold handles non-uniform illumination far better than
    # a global Otsu threshold — critical when students sit near windows or
    # have desk lamps producing harsh shadows.
    thresholded = cv2.adaptiveThreshold(
        equalized,
        maxValue=255,
        adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        thresholdType=cv2.THRESH_BINARY,
        blockSize=adaptive_block_size,
        C=adaptive_c,
    )

    return PreprocessedFrame(
        original=frame,
        grayscale=grayscale,
        denoised=denoised,
        equalized=equalized,
        thresholded=thresholded,
    )
