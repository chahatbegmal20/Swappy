"""
Train an XGBoost virality classifier on the Kaggle social media viral content dataset.

Usage (from repo root):
    python -m data.pipelines.train_virality

Outputs:
    data/models/xgb_virality.pkl   — trained XGBClassifier
    data/models/xgb_scaler.pkl     — fitted StandardScaler (shared with scorer)
"""
import csv
import logging
import os
from datetime import datetime
from pathlib import Path

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

DATASET_PATH = Path("data/datasets/social_media_viral_content_dataset.csv")
MODEL_DIR = Path(os.environ.get("MODEL_PATH", "data/models"))

# ── Feature-engineering constants (mirror scorer.py / text_features.py) ──────

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

PLATFORM_WEIGHTS = {
    "tiktok": 1.0,
    "youtube shorts": 0.95,
    "instagram": 0.85,
    "twitter": 0.75,
    "facebook": 0.65,
}

GENRE_POPULARITY = {
    "technology": 0.90, "entertainment": 0.95, "sports": 0.85,
    "music": 0.92, "gaming": 0.88, "fashion": 0.80,
    "food": 0.78, "travel": 0.75, "health": 0.82, "news": 0.70,
    "comedy": 0.93, "education": 0.65, "science": 0.72,
    "lifestyle": 0.77, "beauty": 0.81,
}

# Must stay in sync with services/ml_inference/scorer.py TABULAR_FEATURE_KEYS
TABULAR_FEATURE_KEYS = [
    "title_length", "title_word_count", "description_length", "description_word_count",
    "hashtag_count", "genre_tag_count", "mood_tag_count",
    "title_has_number", "title_has_question", "title_has_exclamation",
    "title_is_caps_heavy", "title_has_emoji",
    "trending_keyword_count", "trending_keyword_ratio",
    "engagement_booster_count", "engagement_booster_ratio",
    "platform_keyword_match", "avg_hashtag_length", "hashtag_trending_overlap",
    "vocabulary_richness", "avg_word_length",
    "platform_weight", "max_genre_popularity", "avg_genre_popularity", "genre_count",
    "max_mood_engagement", "avg_mood_engagement", "mood_count",
    "has_target_audience", "audience_specificity",
    "is_english", "has_region", "hour_of_day", "day_of_week",
    "is_weekend", "is_peak_hour", "metadata_completeness",
    "brightness", "contrast", "saturation", "color_variety",
    "quality_score", "engagement_prediction", "resolution_score",
    "tempo_normalized", "energy_level", "rhythm_regularity",
    "spectral_centroid_mean", "zero_crossing_rate", "is_tonal",
    "google_interest_now", "google_trend_velocity", "google_is_rising",
    "wiki_pageviews_norm", "hn_relevance_score", "composite_trend_score",
    "trend_similarity",
    "sentiment_score",  # added; directly available in this dataset
]


def row_to_features(row: dict) -> dict:
    """Map one CSV row to a feature dict keyed by TABULAR_FEATURE_KEYS."""
    f = {k: 0.0 for k in TABULAR_FEATURE_KEYS}

    # ── Hashtags ──────────────────────────────────────────────────────────────
    raw = row.get("hashtags", "")
    tags = [t.strip().lstrip("#").lower() for t in raw.split() if t.startswith("#")]
    f["hashtag_count"] = float(len(tags))
    f["genre_tag_count"] = float(len(tags))
    f["avg_hashtag_length"] = float(np.mean([len(t) for t in tags])) if tags else 0.0
    overlap = len(set(tags) & TRENDING_KEYWORDS)
    f["hashtag_trending_overlap"] = float(overlap)
    f["trending_keyword_count"] = float(overlap)
    f["trending_keyword_ratio"] = overlap / max(len(tags), 1)

    # ── Platform ──────────────────────────────────────────────────────────────
    platform = row.get("platform", "").strip().lower()
    f["platform_weight"] = PLATFORM_WEIGHTS.get(platform, 0.70)

    # ── Topic / genre ─────────────────────────────────────────────────────────
    topic = row.get("topic", "").strip().lower()
    pop = GENRE_POPULARITY.get(topic, 0.60)
    f["max_genre_popularity"] = pop
    f["avg_genre_popularity"] = pop
    f["genre_count"] = 1.0

    # ── Language ──────────────────────────────────────────────────────────────
    f["is_english"] = 1.0 if row.get("language", "").strip().lower() == "en" else 0.0

    # ── Region ────────────────────────────────────────────────────────────────
    f["has_region"] = 1.0 if row.get("region", "").strip() else 0.0

    # ── Post datetime → timing features ───────────────────────────────────────
    dt_str = row.get("post_datetime", "")
    try:
        dt = datetime.strptime(dt_str.strip(), "%Y-%m-%d %H:%M:%S")
        f["hour_of_day"] = dt.hour / 23.0
        f["day_of_week"] = dt.weekday() / 6.0
        f["is_weekend"] = 1.0 if dt.weekday() >= 5 else 0.0
        f["is_peak_hour"] = 1.0 if 18 <= dt.hour <= 22 else 0.0
    except Exception:
        pass

    # ── Sentiment (directly from dataset) ────────────────────────────────────
    try:
        f["sentiment_score"] = float(row.get("sentiment_score", 0.0))
    except (ValueError, TypeError):
        f["sentiment_score"] = 0.0

    # ── Metadata completeness ─────────────────────────────────────────────────
    filled = sum(1 for v in row.values() if str(v).strip())
    f["metadata_completeness"] = filled / max(len(row), 1)

    return f


def build_matrix(rows: list[dict]):
    X, y = [], []
    for row in rows:
        feat = row_to_features(row)
        X.append([feat.get(k, 0.0) for k in TABULAR_FEATURE_KEYS])
        y.append(int(row.get("is_viral", 0)))
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


def train():
    try:
        import joblib
        from xgboost import XGBClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
        from sklearn.metrics import roc_auc_score, accuracy_score, classification_report
    except ImportError as e:
        logger.error(f"Missing dependency: {e}. Run: pip install xgboost scikit-learn joblib")
        return

    if not DATASET_PATH.exists():
        logger.error(f"Dataset not found at {DATASET_PATH}")
        return

    logger.info(f"Loading {DATASET_PATH} ...")
    with open(DATASET_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    logger.info(f"  {len(rows)} rows loaded")

    X, y = build_matrix(rows)
    logger.info(f"  Feature matrix: {X.shape}")
    logger.info(f"  Virality rate:  {y.mean():.2%}  ({y.sum()} viral / {len(y) - y.sum()} not viral)")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    pos = (y_train == 1).sum()
    neg = (y_train == 0).sum()
    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        scale_pos_weight=neg / max(pos, 1),
        random_state=42,
        verbosity=0,
        eval_metric="auc",
    )

    logger.info("Training XGBoost classifier ...")
    model.fit(
        X_train_s, y_train,
        eval_set=[(X_test_s, y_test)],
        verbose=False,
    )

    preds = model.predict(X_test_s)
    probs = model.predict_proba(X_test_s)[:, 1]

    acc = accuracy_score(y_test, preds)
    auc = roc_auc_score(y_test, probs)
    logger.info(f"\n  Test accuracy : {acc:.4f}")
    logger.info(f"  Test ROC-AUC  : {auc:.4f}")
    logger.info("\n" + classification_report(y_test, preds, target_names=["not_viral", "viral"]))

    # Top predictive features
    importances = model.feature_importances_
    top = sorted(zip(TABULAR_FEATURE_KEYS, importances), key=lambda x: x[1], reverse=True)[:10]
    logger.info("Top 10 features:")
    for feat, imp in top:
        logger.info(f"  {feat:<35} {imp:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_DIR / "xgb_virality.pkl")
    joblib.dump(scaler, MODEL_DIR / "xgb_scaler.pkl")
    logger.info(f"\nSaved → {MODEL_DIR / 'xgb_virality.pkl'}")
    logger.info(f"Saved → {MODEL_DIR / 'xgb_scaler.pkl'}")


if __name__ == "__main__":
    train()
