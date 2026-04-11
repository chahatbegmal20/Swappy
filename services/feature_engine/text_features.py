"""Text feature extraction using sentence-transformers for real NLP embeddings."""
import re
import logging
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading sentence-transformers model all-MiniLM-L6-v2...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Sentence-transformers model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load sentence-transformers: {e}")
            _model = "unavailable"
    return _model


TRENDING_KEYWORDS = {
    "ai", "artificial intelligence", "chatgpt", "machine learning",
    "viral", "trending", "challenge", "reaction", "tutorial", "how to",
    "review", "unboxing", "gaming", "minecraft", "fortnite", "roblox",
    "music", "song", "remix", "cover", "dance", "tiktok",
    "cooking", "recipe", "fitness", "workout", "travel", "vlog",
    "fashion", "style", "beauty", "makeup", "skincare",
    "tech", "iphone", "android", "crypto", "bitcoin",
    "comedy", "funny", "prank", "storytime", "drama",
    "asmr", "satisfying", "relaxing", "meditation",
}

ENGAGEMENT_BOOSTERS = {
    "secret", "revealed", "shocking", "nobody", "everyone",
    "best", "worst", "top", "ultimate", "insane", "crazy",
    "free", "easy", "fast", "simple", "hack", "trick",
    "first", "last", "only", "never", "always",
}

PLATFORM_KEYWORDS = {
    "youtube": {"subscribe", "like", "comment", "video", "channel", "watch"},
    "tiktok": {"fyp", "foryou", "duet", "stitch", "sound", "trend"},
    "instagram": {"reel", "story", "post", "feed", "explore", "hashtag"},
    "twitter": {"thread", "tweet", "space", "viral", "ratio"},
}


def extract_text_features(
    title: Optional[str] = None,
    description: Optional[str] = None,
    hashtags: Optional[list[str]] = None,
    genre_tags: Optional[list[str]] = None,
    mood_tags: Optional[list[str]] = None,
    target_platform: Optional[str] = None,
) -> dict:
    """Extract numerical features from text content."""
    features = {}
    all_text = " ".join(filter(None, [title, description]))
    all_text_lower = all_text.lower()
    words = re.findall(r'\w+', all_text_lower)

    features["title_length"] = len(title) if title else 0
    features["title_word_count"] = len(title.split()) if title else 0
    features["description_length"] = len(description) if description else 0
    features["description_word_count"] = len(description.split()) if description else 0
    features["hashtag_count"] = len(hashtags) if hashtags else 0
    features["genre_tag_count"] = len(genre_tags) if genre_tags else 0
    features["mood_tag_count"] = len(mood_tags) if mood_tags else 0

    features["title_has_number"] = int(bool(re.search(r'\d', title))) if title else 0
    features["title_has_question"] = int("?" in (title or ""))
    features["title_has_exclamation"] = int("!" in (title or ""))
    features["title_is_caps_heavy"] = int(sum(1 for c in (title or "") if c.isupper()) > len(title or "x") * 0.5)
    features["title_has_emoji"] = int(bool(re.search(r'[\U00010000-\U0010ffff]', title or "")))

    word_set = set(words)
    features["trending_keyword_count"] = len(word_set & TRENDING_KEYWORDS)
    features["trending_keyword_ratio"] = features["trending_keyword_count"] / max(len(words), 1)

    features["engagement_booster_count"] = len(word_set & ENGAGEMENT_BOOSTERS)
    features["engagement_booster_ratio"] = features["engagement_booster_count"] / max(len(words), 1)

    if target_platform and target_platform.lower() in PLATFORM_KEYWORDS:
        platform_words = PLATFORM_KEYWORDS[target_platform.lower()]
        features["platform_keyword_match"] = len(word_set & platform_words)
    else:
        features["platform_keyword_match"] = 0

    if hashtags:
        features["avg_hashtag_length"] = float(np.mean([len(h) for h in hashtags]))
        features["hashtag_trending_overlap"] = len(set(h.lower().strip("#") for h in hashtags) & TRENDING_KEYWORDS)
    else:
        features["avg_hashtag_length"] = 0.0
        features["hashtag_trending_overlap"] = 0

    unique_words = set(words)
    features["vocabulary_richness"] = len(unique_words) / max(len(words), 1)
    features["avg_word_length"] = float(np.mean([len(w) for w in words])) if words else 0.0

    return features


def compute_text_embedding(text: str, dim: int = 384) -> np.ndarray:
    """Compute real text embedding using sentence-transformers.
    Falls back to a deterministic pseudo-embedding if model unavailable."""
    if not text or not text.strip():
        return np.zeros(dim, dtype=np.float32)

    model = _get_model()
    if model != "unavailable" and model is not None:
        try:
            embedding = model.encode(text, convert_to_numpy=True, show_progress_bar=False)
            if embedding.shape[0] != dim:
                padded = np.zeros(dim, dtype=np.float32)
                padded[:min(embedding.shape[0], dim)] = embedding[:dim]
                return padded
            return embedding.astype(np.float32)
        except Exception as e:
            logger.warning(f"Embedding computation failed: {e}")

    import hashlib
    seed = int(hashlib.sha256(text.encode()).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)
    embedding = rng.randn(dim).astype(np.float32)
    return embedding / np.linalg.norm(embedding)


def compute_trend_similarity(content_text: str, trending_topics: list[str]) -> float:
    """Compute cosine similarity between content and trending topics."""
    if not content_text or not trending_topics:
        return 0.0

    model = _get_model()
    if model == "unavailable" or model is None:
        words = set(content_text.lower().split())
        overlap = sum(1 for t in trending_topics if any(w in t.lower() for w in words))
        return min(overlap / max(len(trending_topics), 1), 1.0)

    try:
        content_emb = model.encode(content_text, convert_to_numpy=True, show_progress_bar=False)
        topic_embs = model.encode(trending_topics, convert_to_numpy=True, show_progress_bar=False)
        similarities = np.dot(topic_embs, content_emb) / (
            np.linalg.norm(topic_embs, axis=1) * np.linalg.norm(content_emb) + 1e-8
        )
        return float(np.max(similarities))
    except Exception as e:
        logger.warning(f"Trend similarity computation failed: {e}")
        return 0.0
