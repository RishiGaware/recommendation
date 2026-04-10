from fastapi import HTTPException, status

from app.domains.ai_enhancement.domains.dvms.prompts import (
    SYSTEM_PROMPT,
    build_refinement_prompt,
)
from app.domains.ai_enhancement.domains.dvms.schemas import AIRefineRequest
from app.domains.ai_enhancement.providers.openai_provider import (
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    get_openai_client,
)
import re


def refine_qms_content(payload: AIRefineRequest) -> str:
    prompt = build_refinement_prompt(
        field_type=payload.fieldType,
        user_input=payload.userInput,
        user_prompt=payload.userPrompt,
    )

    try:
        client = get_openai_client()
        request_kwargs = {
            "model": DEFAULT_MODEL,
            "input": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }

        # Some models (e.g., certain reasoning profiles) reject temperature.
        # We'll try with temperature first for supported models, then retry without it.
        response = None
        try:
            response = client.responses.create(
                **request_kwargs,
                temperature=DEFAULT_TEMPERATURE,
            )
        except Exception as inner_exc:
            msg = str(inner_exc)
            if "Unsupported parameter: 'temperature'" not in msg:
                raise
            response = client.responses.create(**request_kwargs)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {exc}",
        ) from exc

    generated_text = (response.output_text or "").strip()
    if not generated_text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="LLM returned an empty response.",
        )

    # If the user asked for an explicit word count (e.g., "5 words"), enforce it as a best-effort.
    m = re.search(r"\b(\d{1,3})\s*words?\b", payload.userPrompt, flags=re.IGNORECASE)
    if m:
        target = int(m.group(1))
        if 1 <= target <= 200:
            words = re.findall(r"\S+", generated_text)
            if len(words) > target:
                generated_text = " ".join(words[:target])
            elif len(words) < target:
                # Do not pad with invented content; keep as-is.
                pass

    return generated_text

