from app.domains.ai_enhancement.models import AIRefineRequest
from app.domains.dvms.ai.prompts import SYSTEM_PROMPT, build_refinement_prompt
from app.domains.ai_enhancement.services.engine import call_ai_engine, enforce_word_count
from app.domains.common.service import robust_text_extraction

class DVMSAIRefineRequest(AIRefineRequest):
    """DVMS-specific refinement request."""
    pass

def refine_dvms_content(payload: DVMSAIRefineRequest) -> str:
    """
    DVMS-specific refinement logic.
    """
    processed_value = payload.value
    if payload.fieldType == "description":
        processed_value = robust_text_extraction(payload.value)

    full_user_prompt = build_refinement_prompt(
        field_type=payload.fieldType,
        user_input=processed_value,
        user_prompt=payload.prompt,
    )

    generated_text = call_ai_engine(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=full_user_prompt
    )

    return enforce_word_count(generated_text, payload.prompt)
