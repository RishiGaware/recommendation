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


def refine_qms_content(payload: AIRefineRequest) -> str:
    prompt = build_refinement_prompt(
        field_type=payload.fieldType,
        user_input=payload.userInput,
        user_prompt=payload.userPrompt,
    )

    try:
        client = get_openai_client()
        response = client.responses.create(
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE,
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )
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

    return generated_text

