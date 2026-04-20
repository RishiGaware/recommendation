from app.domains.ai_enhancement.models import AIRefineRequest
from app.domains.oos.ai.prompts import SYSTEM_PROMPT, build_oos_refinement_prompt
from app.domains.ai_enhancement.services.engine import call_ai_engine, enforce_word_count
from app.domains.common.service import robust_text_extraction

class OOSAIRefineRequest(AIRefineRequest):
    """OOS-specific refinement request."""
    pass

def refine_oos_content(payload: OOSAIRefineRequest) -> str:
    """
    OOS-specific refinement logic.
    """
    processed_value = payload.value
    if payload.fieldType == "oosDescription":
        processed_value = robust_text_extraction(payload.value)

    full_user_prompt = build_oos_refinement_prompt(
        field_type=payload.fieldType,
        user_input=processed_value,
        user_prompt=payload.prompt,
    )

    generated_text = call_ai_engine(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=full_user_prompt
    )

    return enforce_word_count(generated_text, payload.prompt)
