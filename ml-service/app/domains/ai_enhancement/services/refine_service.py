import re
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from app.domains.ai_enhancement.prompts import SYSTEM_PROMPT, build_refinement_prompt
from app.domains.ai_enhancement.models import AIRefineRequest
from app.domains.common.service import robust_text_extraction
from app.core.config import settings

from app.domains.ai_enhancement.providers.openai_provider import (
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    get_openai_client,
)

def _enforce_word_count(text: str, user_prompt: str) -> str:
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

def refine_qms_content(payload: AIRefineRequest) -> str:
    """
    Coordinates the refinement of QMS content using the OpenAI Responses API.
    Includes logic to handle models that do not support temperature.
    """
    processed_value = payload.value
    if payload.fieldType == "description":
        processed_value = robust_text_extraction(payload.value)

    prompt = build_refinement_prompt(
        field_type=payload.fieldType,
        user_input=processed_value,
        user_prompt=payload.prompt,
    )

    try:
        generated_text = ""
        provider = settings.AI_PROVIDER

        if provider == "gemini":
            # --- GEMINI IMPLEMENTATION (NEW SDK) ---
            if not settings.GOOGLE_API_KEY:
                raise RuntimeError("GOOGLE_API_KEY is not configured.")
            
            client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            
            # Use configurable Gemini model with system instructions
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3
                )
            )
            generated_text = (response.text or "").strip()
            
        elif provider == "openai":
            # --- OPENAI IMPLEMENTATION ---
            client = get_openai_client()
            request_params = {
                "model": DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
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

        return _enforce_word_count(generated_text, payload.prompt)

    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        print(f"DEBUG: AI Error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI request failed: {exc}",
        ) from exc
