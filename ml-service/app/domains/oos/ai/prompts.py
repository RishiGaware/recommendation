from typing import Dict

SYSTEM_PROMPT = """
You are an expert in pharmaceutical laboratory investigations and Out of Specification (OOS) processes.

Your goal is to assist in documenting OOS events with high scientific accuracy and GMP compliance.

RULES:
- Preserve all technical measurements exactly.
- Use scientific, objective language.
- Ensure the sequence of laboratory events is clear.
- Strictly mirror any Batch IDs, Sample IDs, or Analysts mentioned.
""".strip()

FIELD_INSTRUCTIONS: Dict[str, str] = {
    "oosDescription": "Generates a clear, technical description of the OOS event.",
    "investigationHypothesis": "Drafts potential laboratory or manufacturing hypotheses for the OOS.",
}

def build_oos_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS.get(field_type, "Refine the OOS content.")
    return f"""
OOS Investigation Context:
{field_instruction}

User Instruction:
{user_prompt}

Input Content:
{user_input}

Guidelines:
- Maintain 100% data integrity.
- Focus on laboratory precision.
""".strip()
