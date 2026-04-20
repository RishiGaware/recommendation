from typing import Dict
import re

SYSTEM_PROMPT = """
You are a pharmaceutical Quality Management System (QMS) expert specializing in deviation documentation.

Your response MUST adhere to the principle of "LITERAL INTEGRITY":
- Follow GMP-compliant, audit-ready language.
- Be strictly based ONLY on the provided input content.
- NEVER assume, modify, reinterpret, or infer technical values (numbers, quantities, layers, IDs).
- CRITICAL: Technical specifications (e.g., "three layers", "04 nos", "Batch No") MUST be mirrored exactly. 
- Do NOT simplify technical data.
- Maintain 100% traceability of all facts from input.

STRICT FORMAT RULE:
- Default response is ALWAYS professional text paragraphs.
- Tables are ONLY permitted if explicitly requested in the User Requirement.
- If the user specifies structure (e.g., "5 paragraphs", "2 tables"), it MUST be followed EXACTLY.

OUTPUT RULES:
- No explanations, no extra commentary.
- Return ONLY the final formatted content.
- Ensure response is suitable for regulatory audit review.
""".strip()

FIELD_INSTRUCTIONS: Dict[str, str] = {
    "description": (
        "Generate or enhance a deviation description in strict GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        "CRITICAL DATA INTEGRITY (LITERAL MIRRORING):\n"
        "- Preserve ALL input data exactly (numbers, IDs, references, counts).\n"
        "- MANDATORY: Do NOT change packaging layer counts.\n"
    ),
    "investigationFindings": (
        "Generate detailed investigation findings in professional GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        "CRITICAL DATA INTEGRITY (LITERAL MIRRORING):\n"
        "- Preserve ALL IDs, serial numbers, and technical references exactly.\n"
    ),
    "impact": (
        "Generate a professional impact assessment in strict GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        "CRITICAL RISK INTEGRITY:\n"
        "- Do NOT upgrade or downgrade the risk level discovered in the input.\n"
    ),
}

FEW_SHOT_EXAMPLES: Dict[str, str] = {
    "description": """
Example:
Input Content:
Temperature reached 12.5C in cold room for 2 hours

Output:
During routine environmental monitoring, the temperature in Cold Storage Room CR-02 was observed at 12.5°C, exceeding the approved storage range of 2°C to 8°C for approximately two hours.
""".strip(),
}

def build_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS.get(field_type, "Refine the following content professionally.")
    few_shot_example = FEW_SHOT_EXAMPLES.get(field_type, "")
    normalized_user_prompt = (user_prompt or "").strip()

    # Detect structure requirements
    structure_hint = ""
    table_requested = "table" in normalized_user_prompt.lower()
    para_requested = "paragraph" in normalized_user_prompt.lower()

    if table_requested:
        structure_hint += "- Include a Markdown table as requested.\n"
    if para_requested:
        structure_hint += "- Follow the requested paragraph count.\n"

    return f"""
Task:
{field_instruction}

User Requirement:
{normalized_user_prompt if normalized_user_prompt else "Refine the content as professional text paragraphs."}

Input Content:
{user_input}

Rules:
- THE USER REQUIREMENT IS THE ABSOLUTE HIGHEST PRIORITY.
- Return ONLY the relevant text content.
- Preserve all numbers, IDs, and technical details exactly.
{structure_hint}

Reference Example:
{few_shot_example}
""".strip()
