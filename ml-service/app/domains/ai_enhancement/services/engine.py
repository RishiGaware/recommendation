import re
from google import genai
from google.genai import types
from fastapi import HTTPException, status
from app.core.config import settings

from app.domains.ai_enhancement.providers.openai_provider import (
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    get_openai_client,
)

def enforce_word_count(text: str, user_prompt: str) -> str:
    """Best-effort word count enforcement via post-processing."""
    match = re.search(r"\b(\d{1,3})\s*words?\b", user_prompt, flags=re.IGNORECASE)
    if not match:
        return text

    target = int(match.group(1))
    if 1 <= target <= 200:
        words = re.findall(r"\S+", text)
        if len(words) > target:
            return " ".join(words[:target])
    return text

def call_ai_engine(system_prompt: str, user_prompt: str) -> str:
    """
    Common engine to call AI providers (Gemini or OpenAI).
    Centralizes error handling and provider orchestration.
    """
    try:
        generated_text = ""
        provider = settings.AI_PROVIDER

        if provider == "gemini":
            if not settings.GOOGLE_API_KEY:
                raise RuntimeError("GOOGLE_API_KEY is not configured.")
            
            client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3
                )
            )
            generated_text = (response.text or "").strip()
            
        elif provider == "openai":
            client = get_openai_client()
            request_params = {
                "model": DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            }
            try:
                response = client.chat.completions.create(**request_params, temperature=DEFAULT_TEMPERATURE)
            except Exception as e:
                error_msg = str(e).lower()
                if "temperature" in error_msg and "unsupported" in error_msg:
                    response = client.chat.completions.create(**request_params)
                else:
                    raise
            generated_text = (response.choices[0].message.content or "").strip()
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")

        if not generated_text:
            raise ValueError("AI returned an empty response")

        return generated_text

    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        print(f"DEBUG: AI Engine Error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI request failed: {exc}",
        ) from exc
