from app.domains.ai_enhancement.domains.dvms.prompts.few_shots import FEW_SHOT_EXAMPLES
from app.domains.ai_enhancement.domains.dvms.prompts.system import SYSTEM_PROMPT
from app.domains.ai_enhancement.domains.dvms.prompts.templates import FIELD_INSTRUCTIONS


def build_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS[field_type]
    few_shot_example = FEW_SHOT_EXAMPLES[field_type]
    normalized_user_prompt = (user_prompt or "").strip()

    # If the user asks for an explicit word count, make it unambiguous for the model.
    word_count_hint = ""
    import re

    match = re.search(r"\b(\d{1,3})\s*words?\b", normalized_user_prompt, flags=re.IGNORECASE)
    if match:
        n_words = int(match.group(1))
        if 1 <= n_words <= 200:
            word_count_hint = f"\nOutput Requirement:\n- Output exactly {n_words} words.\n"

    return f"""
Task:
{field_instruction}

User Requirement:
{normalized_user_prompt}

Input Content:
{user_input}

Rules:
- The User Requirement is highest priority
- Stay within QMS domain
- Do not generate irrelevant content
- Maintain professional compliance tone
- Preserve the original meaning while improving clarity
- Expand or enhance appropriately based on the input length
{word_count_hint}

Reference Example:
{few_shot_example}
""".strip()

