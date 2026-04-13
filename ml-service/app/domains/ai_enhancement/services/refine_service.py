import re
from fastapi import HTTPException, status
from app.domains.ai_enhancement.prompts import SYSTEM_PROMPT, build_refinement_prompt
from app.domains.ai_enhancement.models import AIRefineRequest
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
    prompt = build_refinement_prompt(
        field_type=payload.fieldType,
        user_input=payload.value,
        user_prompt=payload.prompt,
    )

    try:
        client = get_openai_client()
        request_params = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }

        # Attempt to call with temperature, fallback if unsupported (e.g. for o1 models)
        try:
            response = client.chat.completions.create(**request_params, temperature=DEFAULT_TEMPERATURE)
        except Exception as e:
            error_msg = str(e).lower()
            if "temperature" in error_msg and "unsupported" in error_msg:
                response = client.chat.completions.create(**request_params)
            else:
                raise

        generated_text = (response.choices[0].message.content or "").strip()
        if not generated_text:
            raise ValueError("LLM returned an empty response")

        return _enforce_word_count(generated_text, payload.prompt)

    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {exc}",
        ) from exc
