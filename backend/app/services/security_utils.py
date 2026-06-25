import os
import secrets
import hashlib


def create_api_key() -> tuple[str, str]:
  """Return (plaintext_key, key_hash)."""
  plaintext = secrets.token_urlsafe(32)
  return plaintext, hash_api_key(plaintext)


def hash_api_key(value: str) -> str:
  return hashlib.sha256(value.encode("utf-8")).hexdigest()

