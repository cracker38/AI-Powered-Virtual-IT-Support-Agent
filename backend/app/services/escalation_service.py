from __future__ import annotations

from dataclasses import dataclass

from .. import models


@dataclass
class EscalationDecision:
    outcome: str  # "BOT_HANDLE" | "ASK_CLARIFY" | "ESCALATE_TICKET"
    reason: str
    escalation_required: bool = False


HIGH_RISK_INTENTS: set[str] = {
    "password_reset",
    "account_unlock",
    "service_restart",
}


class EscalationService:
    """
    Encapsulates confidence/risk-based escalation logic.

    The goal is to keep the rules transparent and easy to explain in
    the project report while still demonstrating automated escalation
    behaviour:

    - Very low confidence → ask for clarification.
    - Repeated low-confidence interactions → escalate to human.
    - High-risk intents (password/account) demand higher confidence,
      otherwise we either clarify or escalate depending on how many
      exchanges have already occurred.
    """

    def decide(
        self,
        intent: str | None,
        confidence: float,
        conversation: models.Conversation,
    ) -> EscalationDecision:
        message_count = len(conversation.messages or [])

        # No intent or very low confidence → clarification
        if not intent or confidence < 0.4:
            return EscalationDecision(
                outcome="ASK_CLARIFY",
                reason="low_confidence",
            )

        # After several exchanges with still-low confidence, escalate.
        if confidence < 0.6 and message_count >= 4:
            return EscalationDecision(
                outcome="ESCALATE_TICKET",
                reason="repeated_low_confidence",
                escalation_required=True,
            )

        # High-risk intents require higher confidence; otherwise clarify or escalate
        if intent in HIGH_RISK_INTENTS:
            # A couple of back-and-forths with medium confidence → escalate
            if confidence < 0.75 and message_count >= 2:
                return EscalationDecision(
                    outcome="ESCALATE_TICKET",
                    reason="high_risk_medium_confidence_repeated",
                    escalation_required=True,
                )
            if confidence < 0.75:
                return EscalationDecision(
                    outcome="ASK_CLARIFY",
                    reason="high_risk_low_confidence",
                )

        # Fallback: let bot handle
        return EscalationDecision(
            outcome="BOT_HANDLE",
            reason="sufficient_confidence",
        )


