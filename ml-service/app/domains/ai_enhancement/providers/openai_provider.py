from openai import OpenAI

from app.core.config import settings

DEFAULT_MODEL = settings.OPENAI_MODEL
DEFAULT_TEMPERATURE = settings.OPENAI_TEMPERATURE
DEFAULT_TIMEOUT = settings.OPENAI_TIMEOUT_SECONDS


def get_openai_client() -> OpenAI:
    api_key = settings.OPENAI_API_KEY
    if not api_key or not str(api_key).strip():
        raise RuntimeError("OPENAI_API_KEY is not configured.")
    return OpenAI(api_key=api_key, timeout=DEFAULT_TIMEOUT)

