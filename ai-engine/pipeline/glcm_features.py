"""
TalentSecure AI — GLCM Feature Extraction Module
==================================================
Step 2 of the proctoring pipeline.

Computes a Gray Level Co-occurrence Matrix (GLCM) from the preprocessed
grayscale frame and derives three texture descriptors:

  • **Contrast**  — measures local intensity variation.
                    High contrast → busy/cluttered scene (multiple people,
                    hand movements, phone held up).
  • **Energy**    — measures uniformity of the intensity distribution.
                    High energy → homogeneous regions (normal single-person
                    frame with plain background).
  • **Entropy**   — measures randomness / disorder in the texture.
                    High entropy → complex scene (additional objects,
                    overlapping faces, phone screens).

These three features form a compact 3-D descriptor that the downstream
CNN uses alongside the raw pixel data to detect anomalies.

Reference
---------
Haralick, R. M. (1979). "Statistical and structural approaches to texture."
Proceedings of the IEEE, 67(5), 786–804.
"""

import numpy as np
from dataclasses import dataclass
from skimage.feature import graycomatrix, graycoprops


# ── Public data container ─────────────────────────────────────────────────────

@dataclass
class GLCMFeatures:
    """Texture features derived from a single GLCM computation."""
    contrast: float
    energy: float
    entropy: float
    raw_glcm: np.ndarray  # (levels × levels × n_distances × n_angles)


# ── Core extraction ───────────────────────────────────────────────────────────

def extract_glcm_features(
    gray_image: np.ndarray,
    *,
    distances: list[int] | None = None,
    angles: list[float] | None = None,
    levels: int = 64,
    patch_size: int | None = None,
) -> GLCMFeatures:
    """
    Compute the GLCM and derive contrast, energy, and entropy.

    Parameters
    ----------
    gray_image : np.ndarray
        Single-channel uint8 image (H × W).  Typically the ``denoised``
        or ``equalized`` output from the preprocessing step.
    distances : list[int]
        Pixel pair distance offsets.  Default ``[1, 3]`` captures both
        fine-grain and medium-range texture.
    angles : list[float]
        Pixel pair angles in radians.  Default ``[0, π/4, π/2, 3π/4]``
        covers horizontal, diagonal, vertical, and anti-diagonal.
    levels : int
        Number of gray levels for quantization.  Lower values (e.g. 64)
        shrink the GLCM matrix for speed; 256 keeps full resolution.
    patch_size : int | None
        If set, extract GLCM from a centred square crop of this size
        (avoids border artefacts from adaptive thresholding).

    Returns
    -------
    GLCMFeatures
    """
    if distances is None:
        distances = [1, 3]
    if angles is None:
        angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]

    # Optionally crop to a centre patch
    if patch_size is not None:
        h, w = gray_image.shape[:2]
        cy, cx = h // 2, w // 2
        half = patch_size // 2
        gray_image = gray_image[
            max(0, cy - half): cy + half,
            max(0, cx - half): cx + half,
        ]

    # Quantize to `levels` to keep the co-occurrence matrix tractable
    if levels < 256:
        gray_image = (gray_image / 256 * levels).astype(np.uint8)

    # ── Build GLCM ───────────────────────────────────────────────────────
    glcm = graycomatrix(
        gray_image,
        distances=distances,
        angles=angles,
        levels=levels,
        symmetric=True,
        normed=True,
    )

    # ── Derive Haralick descriptors ──────────────────────────────────────
    # Mean across all distance/angle combinations → single scalar each
    contrast = float(graycoprops(glcm, "contrast").mean())
    energy = float(graycoprops(glcm, "energy").mean())

    # scikit-image doesn't expose "entropy" directly via graycoprops,
    # so we compute it from the normalised GLCM ourselves.
    # Entropy  =  -Σ p(i,j) · log₂(p(i,j))
    glcm_norm = glcm.astype(np.float64)
    # Avoid log(0)
    glcm_norm = np.where(glcm_norm > 0, glcm_norm, 1e-10)
    entropy = float(-(glcm_norm * np.log2(glcm_norm)).sum(axis=(0, 1)).mean())

    return GLCMFeatures(
        contrast=contrast,
        energy=energy,
        entropy=entropy,
        raw_glcm=glcm,
    )


# ── Convenience: batch multiple ROIs ─────────────────────────────────────────

def extract_glcm_feature_vector(gray_image: np.ndarray) -> np.ndarray:
    """
    Return a flat ``[contrast, energy, entropy]`` NumPy vector.
    Useful for feeding directly into the CNN's auxiliary input branch.
    """
    f = extract_glcm_features(gray_image)
    return np.array([f.contrast, f.energy, f.entropy], dtype=np.float32)
