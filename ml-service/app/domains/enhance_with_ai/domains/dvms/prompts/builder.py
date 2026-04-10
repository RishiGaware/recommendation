from app.domains.enhance_with_ai.domains.dvms.prompts.few_shots import FEW_SHOT_EXAMPLES
from app.domains.enhance_with_ai.domains.dvms.prompts.system import SYSTEM_PROMPT
from app.domains.enhance_with_ai.domains.dvms.prompts.templates import FIELD_INSTRUCTIONS


def build_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS[field_type]
    few_shot_example = FEW_SHOT_EXAMPLES[field_type]

    return f"""
Task:
{field_instruction}

User Requirement:
{user_prompt}

Input Content:
{user_input}

Rules:
- Stay within QMS domain
- Do not generate irrelevant content
- Maintain professional compliance tone
- Preserve the original meaning while improving clarity
- Expand or enhance appropriately based on the input length

Reference Example:
{few_shot_example}
""".strip()

