from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class NLUResult:
    intent: Optional[str]
    confidence: float
    language: str


class NLPService:
    """
    High-level NLP facade.

    This is currently backed by simple keyword logic but is designed so we can
    transparently plug in Hugging Face transformer models for:
    - language detection
    - intent classification
    - NER
    - embeddings for semantic search
    """

    def __init__(self) -> None:
        # TODO: load real models (e.g. XLM-R) and sentence-transformers
        self._dummy_intents = {
            "password": "password_reset",
            "unlock": "account_unlock",
            "vpn": "vpn_issue",
        }

    def detect_language(self, text: str, hint: Optional[str] = None) -> str:
        # Placeholder: prefer hint, otherwise default to English
        return (hint or "en").lower()

    def classify_intent(self, text: str, language: str) -> NLUResult:
        lowered = text.lower()
        for keyword, intent in self._dummy_intents.items():
            if keyword in lowered:
                return NLUResult(intent=intent, confidence=0.9, language=language)
        return NLUResult(intent=None, confidence=0.4, language=language)

    def parse(self, text: str, language_hint: Optional[str] = None) -> NLUResult:
        language = self.detect_language(text, language_hint)
        return self.classify_intent(text, language)


nlp_service = NLPService()

