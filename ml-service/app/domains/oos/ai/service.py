from app.domains.ai_enhancement.models import AIRefineRequest
from app.domains.oos.ai.prompts import SYSTEM_PROMPT, build_oos_refinement_prompt
from app.domains.ai_enhancement.services.engine import call_ai_engine, enforce_word_count

class OOSAIRefineRequest(AIRefineRequest):
    """OOS-specific refinement request."""
    pass

def refine_oos_content(payload: OOSAIRefineRequest) -> str:
    """
    OOS-specific refinement logic.
    """
    full_user_prompt = build_oos_refinement_prompt(
        field_type=payload.fieldType,
        user_input=payload.value,
        user_prompt=payload.prompt,
    )

    generated_text = call_ai_engine(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=full_user_prompt
    )

    return enforce_word_count(generated_text, payload.prompt)
