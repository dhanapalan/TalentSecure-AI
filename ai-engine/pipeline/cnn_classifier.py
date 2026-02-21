"""
TalentSecure AI — CNN Anomaly Classifier
==========================================
Step 3 of the proctoring pipeline.

Architecture
------------
A dual-input Convolutional Neural Network:

  Input A  →  The preprocessed grayscale frame (224 × 224 × 1)
              passes through a stack of Conv2D → BatchNorm → ReLU → MaxPool
              layers that learn spatial patterns (face shape, phone outline,
              multiple silhouettes).

  Input B  →  A 3-element GLCM feature vector [contrast, energy, entropy]
              injected into the fully-connected head via concatenation.

  Output   →  Softmax over 4 classes:
                0  normal           — single test-taker, no anomaly
                1  multiple_faces   — more than one person detected
                2  mobile_detected  — handheld device / phone in frame
                3  suspicious       — posture anomaly, unusual movement

The model definition below is a *placeholder structure*.  In production the
model would be trained on a labelled proctoring dataset, and the saved
weights loaded at startup.  For development the model is instantiated with
random (Xavier-initialized) weights — the pipeline will still run end-to-end,
and the confidence threshold gates whether an alert fires.

Training is NOT performed at request time.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model

# ── Constants ─────────────────────────────────────────────────────────────────

IMG_HEIGHT = 224
IMG_WIDTH = 224
IMG_CHANNELS = 1       # grayscale
GLCM_FEATURE_DIM = 3   # contrast, energy, entropy

CLASS_NAMES: list[str] = [
    "normal",            # 0
    "multiple_faces",    # 1
    "mobile_detected",   # 2
    "suspicious",        # 3
]

NUM_CLASSES = len(CLASS_NAMES)

MODEL_WEIGHTS_PATH = os.getenv(
    "CNN_WEIGHTS_PATH",
    os.path.join(os.path.dirname(__file__), "..", "models", "proctor_cnn.h5"),
)


# ── Model builder ─────────────────────────────────────────────────────────────

def build_proctor_cnn() -> Model:
    """
    Construct the dual-input CNN used for proctoring frame classification.

    The image branch uses 4 convolutional blocks with increasing filter
    depth (32 → 64 → 128 → 256).  Each block:
        Conv2D(3×3) → BatchNormalization → ReLU → MaxPooling(2×2)

    The GLCM branch is a tiny dense network (3 → 32 → 32) whose output
    is concatenated with the flattened conv features before the final
    classification head.

    Returns
    -------
    tensorflow.keras.Model
        Compiled model ready for .predict()  (or .fit() during training).
    """

    # ── Image branch (Input A) ───────────────────────────────────────────
    image_input = layers.Input(
        shape=(IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS),
        name="image_input",
    )

    x = _conv_block(image_input, filters=32, name="block1")
    x = _conv_block(x, filters=64, name="block2")
    x = _conv_block(x, filters=128, name="block3")
    x = _conv_block(x, filters=256, name="block4")

    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(0.4, name="img_dropout")(x)

    # ── GLCM branch (Input B) ───────────────────────────────────────────
    glcm_input = layers.Input(
        shape=(GLCM_FEATURE_DIM,),
        name="glcm_input",
    )
    g = layers.Dense(32, activation="relu", name="glcm_dense1")(glcm_input)
    g = layers.Dense(32, activation="relu", name="glcm_dense2")(g)

    # ── Merge & classify ─────────────────────────────────────────────────
    merged = layers.Concatenate(name="merge")([x, g])
    merged = layers.Dense(128, activation="relu", name="fc1")(merged)
    merged = layers.Dropout(0.3, name="fc_dropout")(merged)
    output = layers.Dense(NUM_CLASSES, activation="softmax", name="predictions")(merged)

    model = Model(
        inputs=[image_input, glcm_input],
        outputs=output,
        name="ProctorCNN",
    )

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    return model


# ── Private helpers ───────────────────────────────────────────────────────────

def _conv_block(x, filters: int, name: str):
    """Conv2D → BatchNorm → ReLU → MaxPool block."""
    x = layers.Conv2D(
        filters, (3, 3), padding="same", name=f"{name}_conv",
    )(x)
    x = layers.BatchNormalization(name=f"{name}_bn")(x)
    x = layers.Activation("relu", name=f"{name}_relu")(x)
    x = layers.MaxPooling2D((2, 2), name=f"{name}_pool")(x)
    return x


# ── Model loader (singleton) ─────────────────────────────────────────────────

_model_cache: Model | None = None


def get_model() -> Model:
    """
    Return the loaded model (creates once, caches for every subsequent call).

    If a trained weights file exists at ``MODEL_WEIGHTS_PATH``, it is loaded.
    Otherwise the model starts with Xavier-initialized random weights
    (acceptable for development / integration testing).
    """
    global _model_cache
    if _model_cache is not None:
        return _model_cache

    model = build_proctor_cnn()

    if os.path.isfile(MODEL_WEIGHTS_PATH):
        model.load_weights(MODEL_WEIGHTS_PATH)
        print(f"[CNN] Loaded trained weights from {MODEL_WEIGHTS_PATH}")
    else:
        print("[CNN] No trained weights found — using random initialization")
        print(f"      (expected path: {MODEL_WEIGHTS_PATH})")

    model.summary(print_fn=lambda line: print(f"  {line}"))
    _model_cache = model
    return model


# ── Inference helper ──────────────────────────────────────────────────────────

def classify_frame(
    gray_224: np.ndarray,
    glcm_vector: np.ndarray,
) -> dict:
    """
    Classify a single preprocessed frame.

    Parameters
    ----------
    gray_224 : np.ndarray
        Grayscale image resized to (224, 224), dtype uint8 or float32.
    glcm_vector : np.ndarray
        Shape (3,) — [contrast, energy, entropy].

    Returns
    -------
    dict  with keys ``label``, ``class_index``, ``confidence``, ``probabilities``
    """
    model = get_model()

    # Normalise image to [0, 1] and reshape to batch dimension
    img = gray_224.astype(np.float32) / 255.0
    img = img.reshape(1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS)

    glcm = glcm_vector.astype(np.float32).reshape(1, GLCM_FEATURE_DIM)

    preds = model.predict([img, glcm], verbose=0)[0]  # shape (NUM_CLASSES,)

    class_idx = int(np.argmax(preds))
    return {
        "label": CLASS_NAMES[class_idx],
        "class_index": class_idx,
        "confidence": float(preds[class_idx]),
        "probabilities": {
            name: float(prob) for name, prob in zip(CLASS_NAMES, preds)
        },
    }
