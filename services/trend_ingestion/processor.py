"""Process and validate incoming trend signals."""
from datetime import datetime, timezone
from typing import Any, Optional


class TrendProcessor:
    """Validates, deduplicates, and normalizes trend signals."""
    
    def process_batch(self, signals: list[dict]) -> list[dict]:
        """Process a batch of raw trend signals."""
        processed = []
        seen = set()
        
        for signal in signals:
            validated = self.validate(signal)
            if validated is None:
                continue
            
            key = self._dedup_key(validated)
            if key in seen:
                continue
            seen.add(key)
            
            normalized = self.normalize(validated)
            processed.append(normalized)
        
        return processed
    
    def validate(self, signal: dict) -> Optional[dict]:
        """Validate a single trend signal."""
        required = ["source", "topic", "signal_type"]
        if not all(signal.get(k) for k in required):
            return None
        
        valid_types = {"hot", "emerging", "stable", "saturated", "declining", "niche but promising"}
        if signal.get("signal_type") not in valid_types:
            return None
        
        if not isinstance(signal.get("velocity", 0), (int, float)):
            return None
        if not isinstance(signal.get("volume", 0), (int, float)):
            return None
        
        return signal
    
    def normalize(self, signal: dict) -> dict:
        """Normalize field values."""
        signal["source"] = signal["source"].lower().strip()
        signal["topic"] = signal["topic"].strip()
        signal["category"] = (signal.get("category") or "uncategorized").strip()
        signal["region"] = (signal.get("region") or "global").upper().strip()
        
        if isinstance(signal.get("captured_at"), str):
            try:
                signal["captured_at"] = datetime.fromisoformat(signal["captured_at"])
            except ValueError:
                signal["captured_at"] = datetime.now(timezone.utc)
        elif not isinstance(signal.get("captured_at"), datetime):
            signal["captured_at"] = datetime.now(timezone.utc)
        
        return signal
    
    def _dedup_key(self, signal: dict) -> str:
        return f"{signal['source']}:{signal['topic']}:{signal.get('region', 'global')}"
    
    def detect_quality_issues(self, signals: list[dict]) -> dict:
        """Run data quality checks on a batch of signals."""
        issues = {
            "total": len(signals),
            "missing_category": 0,
            "missing_region": 0,
            "zero_velocity": 0,
            "zero_volume": 0,
            "stale_signals": 0,
            "quality_score": 1.0,
        }
        
        now = datetime.now(timezone.utc)
        
        for s in signals:
            if not s.get("category"):
                issues["missing_category"] += 1
            if not s.get("region"):
                issues["missing_region"] += 1
            if s.get("velocity", 0) == 0:
                issues["zero_velocity"] += 1
            if s.get("volume", 0) == 0:
                issues["zero_volume"] += 1
            captured = s.get("captured_at")
            if isinstance(captured, datetime) and (now - captured).total_seconds() > 86400:
                issues["stale_signals"] += 1
        
        total = max(len(signals), 1)
        penalty = (
            issues["missing_category"] / total * 0.1
            + issues["missing_region"] / total * 0.1
            + issues["zero_velocity"] / total * 0.2
            + issues["zero_volume"] / total * 0.2
            + issues["stale_signals"] / total * 0.3
        )
        issues["quality_score"] = round(max(0, 1 - penalty), 3)
        
        return issues
