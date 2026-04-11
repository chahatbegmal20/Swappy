"""Image feature extraction using CLIP for thumbnail/visual analysis."""
import logging
from pathlib import Path
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

_clip_model = None
_clip_preprocess = None
_clip_tokenizer = None


def _get_clip():
    global _clip_model, _clip_preprocess, _clip_tokenizer
    if _clip_model is None:
        try:
            import open_clip
            import torch

            model, _, preprocess = open_clip.create_model_and_transforms(
                "ViT-B-32", pretrained="laion2b_s34b_b79k"
            )
            model.eval()
            _clip_model = model
            _clip_preprocess = preprocess
            _clip_tokenizer = open_clip.get_tokenizer("ViT-B-32")
            logger.info("CLIP ViT-B/32 loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load CLIP model: {e}")
            _clip_model = "unavailable"
    return _clip_model, _clip_preprocess, _clip_tokenizer


QUALITY_PROMPTS = [
    "a high quality professional thumbnail",
    "an eye-catching viral video thumbnail",
    "a bright colorful engaging image",
    "a well-composed photograph with good lighting",
]

LOW_QUALITY_PROMPTS = [
    "a blurry low quality image",
    "a dark poorly lit photograph",
    "a boring plain uninteresting image",
]


def extract_image_features(image_path: str) -> dict:
    """Extract features from an image file using CLIP and color analysis."""
    features = {}
    path = Path(image_path)

    if not path.exists():
        logger.warning(f"Image not found: {image_path}")
        return _empty_image_features()

    try:
        from PIL import Image
        img = Image.open(path).convert("RGB")
    except Exception as e:
        logger.warning(f"Could not open image: {e}")
        return _empty_image_features()

    features.update(_extract_color_features(img))
    features.update(_extract_composition_features(img))

    clip_model, clip_preprocess, clip_tokenizer = _get_clip()
    if clip_model != "unavailable" and clip_model is not None:
        features.update(_extract_clip_features(img, clip_model, clip_preprocess, clip_tokenizer))
    else:
        features["clip_available"] = False
        features["quality_score"] = features.get("brightness", 0.5) * 0.6 + features.get("saturation", 0.5) * 0.4
        features["engagement_prediction"] = features["quality_score"]

    return features


def compute_image_embedding(image_path: str) -> Optional[np.ndarray]:
    """Compute 512-dim CLIP embedding for an image."""
    path = Path(image_path)
    if not path.exists():
        return None

    clip_model, clip_preprocess, _ = _get_clip()
    if clip_model == "unavailable" or clip_model is None:
        return None

    try:
        import torch
        from PIL import Image

        img = Image.open(path).convert("RGB")
        image_input = clip_preprocess(img).unsqueeze(0)

        with torch.no_grad():
            embedding = clip_model.encode_image(image_input)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            return embedding.squeeze().cpu().numpy().astype(np.float32)
    except Exception as e:
        logger.warning(f"CLIP embedding failed: {e}")
        return None


def _extract_color_features(img) -> dict:
    """Extract color histogram and composition features."""
    arr = np.array(img.resize((128, 128)))
    features = {}

    features["brightness"] = float(np.mean(arr) / 255.0)
    features["contrast"] = float(np.std(arr) / 128.0)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    features["red_dominance"] = float(np.mean(r) / 255.0)
    features["green_dominance"] = float(np.mean(g) / 255.0)
    features["blue_dominance"] = float(np.mean(b) / 255.0)

    hsv_approx = np.max(arr, axis=2) - np.min(arr, axis=2)
    features["saturation"] = float(np.mean(hsv_approx) / 255.0)
    features["color_variety"] = float(np.std(hsv_approx) / 128.0)

    features["is_warm_toned"] = int(np.mean(r) > np.mean(b))
    features["is_high_contrast"] = int(features["contrast"] > 0.5)

    return features


def _extract_composition_features(img) -> dict:
    """Basic composition analysis."""
    width, height = img.size
    features = {}
    features["aspect_ratio"] = width / max(height, 1)
    features["is_landscape"] = int(width > height)
    features["is_square"] = int(abs(width - height) < max(width, height) * 0.1)
    features["resolution_score"] = min((width * height) / (1920 * 1080), 1.0)
    return features


def _extract_clip_features(img, model, preprocess, tokenizer) -> dict:
    """CLIP zero-shot scoring for thumbnail quality."""
    import torch

    features = {"clip_available": True}

    try:
        image_input = preprocess(img).unsqueeze(0)

        all_prompts = QUALITY_PROMPTS + LOW_QUALITY_PROMPTS
        text_tokens = tokenizer(all_prompts)

        with torch.no_grad():
            image_features = model.encode_image(image_input)
            text_features = model.encode_text(text_tokens)

            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            similarities = (image_features @ text_features.T).squeeze().cpu().numpy()

        quality_sim = float(np.mean(similarities[:len(QUALITY_PROMPTS)]))
        low_quality_sim = float(np.mean(similarities[len(QUALITY_PROMPTS):]))

        features["quality_score"] = float(np.clip((quality_sim - low_quality_sim + 1) / 2, 0, 1))
        features["engagement_prediction"] = float(np.clip(np.max(similarities[:len(QUALITY_PROMPTS)]), 0, 1))
        features["professional_look"] = float(np.clip(quality_sim, 0, 1))

    except Exception as e:
        logger.warning(f"CLIP feature extraction failed: {e}")
        features["quality_score"] = 0.5
        features["engagement_prediction"] = 0.5
        features["professional_look"] = 0.5

    return features


def _empty_image_features() -> dict:
    return {
        "brightness": 0.0, "contrast": 0.0, "saturation": 0.0,
        "color_variety": 0.0, "red_dominance": 0.0, "green_dominance": 0.0,
        "blue_dominance": 0.0, "is_warm_toned": 0, "is_high_contrast": 0,
        "aspect_ratio": 0.0, "is_landscape": 0, "is_square": 0,
        "resolution_score": 0.0, "clip_available": False,
        "quality_score": 0.0, "engagement_prediction": 0.0,
    }
