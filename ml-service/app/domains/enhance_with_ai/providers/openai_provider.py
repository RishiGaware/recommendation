from openai import OpenAI

from app.domains.enhance_with_ai.core.config import get_env, get_float_env


DEFAULT_MODEL = get_env("OPENAI_MODEL", "gpt-4.1-mini")
DEFAULT_TEMPERATURE = get_float_env("OPENAI_TEMPERATURE", 0.3)
DEFAULT_TIMEOUT = get_float_env("OPENAI_TIMEOUT_SECONDS", 45.0)


def get_openai_client() -> OpenAI:
    api_key = get_env("OPENAI_API_KEY")
    return OpenAI(api_key=api_key, timeout=DEFAULT_TIMEOUT)

