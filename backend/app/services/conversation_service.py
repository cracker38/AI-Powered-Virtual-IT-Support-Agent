from __future__ import annotations

from sqlalchemy.orm import Session

from .. import models, schemas
from ..nlp.service import nlp_service
from .analytics_service import log_event
from .escalation_service import EscalationService


class ConversationService:
    def __init__(self, db: Session, user: models.User) -> None:
        self.db = db
        self.user = user
        self.escalation = EscalationService()

    def _get_or_create_conversation(self, conversation_id: int | None) -> models.Conversation:
        if conversation_id is not None:
            conv = (
                self.db.query(models.Conversation)
                .filter(
                    models.Conversation.id == conversation_id,
                    models.Conversation.user_id == self.user.id,
                )
                .first()
            )
            if conv:
                return conv

        conv = models.Conversation(user_id=self.user.id)
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)

        # Log conversation start for analytics
        log_event(
            self.db,
            "CONVERSATION_STARTED",
            user_id=self.user.id,
            conversation_id=conv.id,
        )
        return conv

    def handle_query(self, payload: schemas.ChatQueryRequest) -> schemas.ChatQueryResponse:
        conversation = self._get_or_create_conversation(payload.conversation_id)

        nlu_result = nlp_service.parse(payload.message, payload.language_hint)

        intent_obj: models.Intent | None = None
        if nlu_result.intent:
            intent_obj = (
                self.db.query(models.Intent)
                .filter(models.Intent.name == nlu_result.intent)
                .first()
            )

        user_message = models.Message(
            conversation_id=conversation.id,
            sender_type=models.SenderType.USER,
            message_text=payload.message,
            language=nlu_result.language,
            nlu_intent_id=intent_obj.id if intent_obj else None,
            nlu_confidence=nlu_result.confidence,
        )
        self.db.add(user_message)

        decision = self.escalation.decide(
            intent=nlu_result.intent,
            confidence=nlu_result.confidence,
            conversation=conversation,
        )

        actions: list[str]
        if decision.outcome == "ASK_CLARIFY":
            reply_text = (
                "I'm not completely sure I understood your request. "
                "Can you please clarify what you need help with (e.g. password reset, VPN issue, software problem)?"
            )
            actions = ["ASK_CLARIFICATION"]
            log_event(
                self.db,
                "ASKED_FOR_CLARIFICATION",
                user_id=self.user.id,
                conversation_id=conversation.id,
                metadata={"intent": nlu_result.intent, "confidence": nlu_result.confidence},
            )
        elif decision.outcome == "ESCALATE_TICKET":
            # Create a simple local ticket linked to this conversation
            ticket = models.Ticket(
                external_ticket_id=f"VA-{conversation.id}",
                user_id=conversation.user_id,
                source="VIRTUAL_ASSISTANT",
                status="OPEN",
                priority=None,
                category=nlu_result.intent or "unknown",
            )
            self.db.add(ticket)
            self.db.flush()

            conversation.linked_ticket_id = ticket.id

            reply_text = (
                "I will escalate this issue to a human support agent and share this conversation "
                "for faster resolution."
            )
            actions = ["ESCALATE_TICKET"]

            log_event(
                self.db,
                "ESCALATED_TO_HUMAN",
                user_id=self.user.id,
                conversation_id=conversation.id,
                metadata={"intent": nlu_result.intent, "ticket_id": ticket.id},
            )
        else:
            reply_text = self._build_reply(nlu_result.intent)
            actions = []

            # Treat this as an automated resolution for analytics
            log_event(
                self.db,
                "INTENT_RESOLVED_AUTOMATED",
                user_id=self.user.id,
                conversation_id=conversation.id,
                metadata={"intent": nlu_result.intent, "confidence": nlu_result.confidence},
            )

        bot_message = models.Message(
            conversation_id=conversation.id,
            sender_type=models.SenderType.BOT,
            message_text=reply_text,
            language=nlu_result.language,
        )
        self.db.add(bot_message)

        self.db.commit()

        return schemas.ChatQueryResponse(
            conversation_id=conversation.id,
            reply=reply_text,
            confidence=nlu_result.confidence,
            intent=nlu_result.intent,
            actions=actions,
        )

    @staticmethod
    def _build_reply(intent: str | None) -> str:
        if intent == "password_reset":
            return "I can help reset your password. Please confirm this is for your Windows/AD account."
        if intent == "account_unlock":
            return "I can help unlock your account. Please confirm your username or sign-in ID."
        if intent == "vpn_issue":
            return (
                "It seems you have a VPN-related issue. First, ensure you're connected to the internet, "
                "then try reconnecting to the VPN. If that fails, tell me the exact error message you see."
            )
        return (
            "I have received your request. I can help with password resets, account unlocks, VPN issues, and "
            "common software problems. Please briefly describe your issue."
        )

