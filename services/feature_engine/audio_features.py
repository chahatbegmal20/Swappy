"""Audio feature extraction using librosa for music/audio analysis."""
import logging
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)


def extract_audio_features(audio_path: str) -> dict:
    """Extract audio features using librosa. Works with wav, mp3, ogg, flac, etc."""
    path = Path(audio_path)
    features = {}

    if not path.exists():
        logger.warning(f"Audio file not found: {audio_path}")
        return _empty_audio_features()

    try:
        import librosa

        y, sr = librosa.load(str(path), sr=22050, duration=60)

        if len(y) == 0:
            return _empty_audio_features()

        features.update(_extract_rhythm_features(y, sr))
        features.update(_extract_spectral_features(y, sr))
        features.update(_extract_mfcc_features(y, sr))
        features.update(_extract_energy_features(y, sr))
        features.update(_extract_chroma_features(y, sr))
        features["audio_available"] = True

    except Exception as e:
        logger.warning(f"Audio feature extraction failed: {e}")
        return _empty_audio_features()

    return features


def _extract_rhythm_features(y: np.ndarray, sr: int) -> dict:
    import librosa
    features = {}

    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    features["tempo"] = float(tempo) if np.isscalar(tempo) else float(tempo[0])
    features["beat_count"] = int(len(beat_frames))
    features["beats_per_second"] = features["beat_count"] / max(len(y) / sr, 1)

    features["is_fast_tempo"] = int(features["tempo"] > 120)
    features["is_slow_tempo"] = int(features["tempo"] < 80)
    features["tempo_normalized"] = float(np.clip(features["tempo"] / 200.0, 0, 1))

    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    features["onset_strength_mean"] = float(np.mean(onset_env))
    features["onset_strength_std"] = float(np.std(onset_env))
    features["rhythm_regularity"] = 1.0 / (1.0 + features["onset_strength_std"])

    return features


def _extract_spectral_features(y: np.ndarray, sr: int) -> dict:
    import librosa
    features = {}

    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    features["spectral_centroid_mean"] = float(np.mean(centroid))
    features["spectral_centroid_std"] = float(np.std(centroid))

    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]
    features["spectral_rolloff_mean"] = float(np.mean(rolloff))

    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    features["spectral_bandwidth_mean"] = float(np.mean(bandwidth))

    flatness = librosa.feature.spectral_flatness(y=y)[0]
    features["spectral_flatness_mean"] = float(np.mean(flatness))
    features["is_tonal"] = int(features["spectral_flatness_mean"] < 0.1)

    zcr = librosa.feature.zero_crossing_rate(y=y)[0]
    features["zero_crossing_rate"] = float(np.mean(zcr))

    features["brightness_audio"] = float(np.clip(
        features["spectral_centroid_mean"] / (sr / 2), 0, 1
    ))

    return features


def _extract_mfcc_features(y: np.ndarray, sr: int) -> dict:
    import librosa
    features = {}

    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    for i in range(13):
        features[f"mfcc_{i}_mean"] = float(np.mean(mfccs[i]))
        features[f"mfcc_{i}_std"] = float(np.std(mfccs[i]))

    return features


def _extract_energy_features(y: np.ndarray, sr: int) -> dict:
    import librosa
    features = {}

    rms = librosa.feature.rms(y=y)[0]
    features["rms_mean"] = float(np.mean(rms))
    features["rms_std"] = float(np.std(rms))
    features["dynamic_range"] = float(np.max(rms) - np.min(rms)) if len(rms) > 0 else 0.0

    features["energy_level"] = float(np.clip(features["rms_mean"] * 10, 0, 1))
    features["is_high_energy"] = int(features["energy_level"] > 0.5)
    features["is_quiet"] = int(features["energy_level"] < 0.2)

    return features


def _extract_chroma_features(y: np.ndarray, sr: int) -> dict:
    import librosa
    features = {}

    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    features["chroma_mean"] = float(np.mean(chroma))
    features["chroma_std"] = float(np.std(chroma))

    dominant_pitch_class = int(np.argmax(np.mean(chroma, axis=1)))
    features["dominant_pitch_class"] = dominant_pitch_class
    features["harmonic_complexity"] = float(np.std(np.mean(chroma, axis=1)))

    return features


def _empty_audio_features() -> dict:
    features = {
        "tempo": 0.0, "beat_count": 0, "beats_per_second": 0.0,
        "is_fast_tempo": 0, "is_slow_tempo": 0, "tempo_normalized": 0.0,
        "onset_strength_mean": 0.0, "onset_strength_std": 0.0, "rhythm_regularity": 0.0,
        "spectral_centroid_mean": 0.0, "spectral_centroid_std": 0.0,
        "spectral_rolloff_mean": 0.0, "spectral_bandwidth_mean": 0.0,
        "spectral_flatness_mean": 0.0, "is_tonal": 0,
        "zero_crossing_rate": 0.0, "brightness_audio": 0.0,
        "rms_mean": 0.0, "rms_std": 0.0, "dynamic_range": 0.0,
        "energy_level": 0.0, "is_high_energy": 0, "is_quiet": 0,
        "chroma_mean": 0.0, "chroma_std": 0.0,
        "dominant_pitch_class": 0, "harmonic_complexity": 0.0,
        "audio_available": False,
    }
    for i in range(13):
        features[f"mfcc_{i}_mean"] = 0.0
        features[f"mfcc_{i}_std"] = 0.0
    return features
