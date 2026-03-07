from fastapi import APIRouter, Depends

from ..models import User
from ..security.auth import get_current_active_user


router = APIRouter(prefix="/chat", tags=["chat"])

# Simple FAQ responses for guest (limited scope, no auth)
GUEST_FAQS = {
    "password": "For password reset, please log in to your account. If you need help, contact your IT department.",
    "login": "If you're having trouble logging in, ensure your credentials are correct. Reset your password or contact IT support.",
    "email": "For email issues, check your internet connection and server status. Contact IT if the problem persists.",
    "vpn": "VPN issues: verify your credentials and that you're connected to the company network. Contact IT for configuration help.",
    "outlook": "For Outlook issues, try restarting the application. If problems persist, contact IT support.",
    "computer": "For computer issues, try restarting first. If the problem continues, submit a ticket after logging in.",
    "help": "Welcome! I can answer basic IT FAQs. Log in for full support: chat, tickets, and knowledge base.",
    "hi": "Hello! I'm the CYPADI IT support assistant. Ask me a simple question or log in for full support.",
    "hello": "Hello! How can I help you today? Log in for full troubleshooting and ticket submission.",
}


@router.post("/guest-message")
def guest_send_message(payload: dict):
    """
    Guest chat: limited scope, simple FAQs only. No auth required.
    """
    message = (payload.get("message") or "").strip().lower()
    if not message:
        return {"ai_reply": "Please enter a question.", "intent": "empty", "confidence": 0}

    reply = None
    for keyword, response in GUEST_FAQS.items():
        if keyword in message:
            reply = response
            break
    if not reply:
        reply = (
            "Thanks for your question. For full support—troubleshooting, tickets, and the knowledge base—"
            "please log in to your account."
        )
    return {"ai_reply": reply, "intent": "guest_faq", "confidence": 0.6}


@router.post("/message")
def send_message(
    payload: dict,
    current_user: User = Depends(get_current_active_user),
):
    """
    Minimal placeholder chat endpoint.

    It simply echoes the user message and returns a dummy AI response.
    In future iterations this will integrate with a full NLP pipeline and
    troubleshooting workflows.
    """
    message = payload.get("message", "")
    language = payload.get("language", "en")

    # Very simple rule-based placeholder for now.
    if "password" in message.lower():
        ai_reply = "It seems you have a password-related issue. You can use the password reset option or contact IT if this does not help."
        intent = "password_issue"
        confidence = 0.7
    else:
        ai_reply = "Thank you for your question. A smarter AI response engine will be added here."
        intent = "general_it_support"
        confidence = 0.5

    return {
        "user_message": message,
        "language": language,
        "ai_reply": ai_reply,
        "intent": intent,
        "confidence": confidence,
    }

