from typing import Dict
import re

SYSTEM_PROMPT = """
You are a pharmaceutical Quality Management System expert supporting deviation documentation.
Write in a professional GMP-compliant tone.
Stay strictly within pharmaceutical QMS context.
Do not invent irrelevant details, regulations, or data not implied by the input.
Follow the User Requirement with highest priority.
Provide content in the format (table, paragraph, etc.) specified in the field instructions below.
Return only the final refined content with no preamble or labels.
""".strip()

FIELD_INSTRUCTIONS: Dict[str, str] = {
    "description": (
        "Generate or enhance a deviation description. "
        "MANDATORY FORMAT: Start with a Markdown Table summarizing key facts. "
        "The table MUST follow this exact three-part structure:\n"
        "1. Header row (e.g., | Field | Value |)\n"
        "2. Separator row (REQUIRED: | --- | --- |)\n"
        "3. Data rows (e.g., | Deviation ID | DEV-001 |)\n\n"
        "Follow the table with a detailed descriptive paragraph. "
        "Include columns for Deviation ID, Date, Location, and Observed Value."
    ),
    "investigationFindings": (
        "Generate detailed investigation findings as professional plain text paragraphs. "
        "Do NOT use Markdown tables for this field. Focus on logical analysis, evidence-based "
        "reasoning, and a plausible root cause statement grounded in the provided facts."
    ),
    "impact": (
        "Generate an impact assessment as professional plain text paragraphs. "
        "Do NOT use Markdown tables for this field. Focus on product quality, patient safety, "
        "regulatory compliance, batch disposition, and operational risk."
    ),
}

FEW_SHOT_EXAMPLES: Dict[str, str] = {
    "description": """
Example:
Input Content:
Temperature reached 12.5C in cold room for 2 hours

Output:
| Deviation ID | Date | Department | Location | Observed Value | Limit | Duration |
| --- | --- | --- | --- | --- | --- | --- |
| DEV-2024-001 | 08-Apr-2026 | Warehouse | Cold Storage Room CR-02 | 12.5°C | 2.0-8.0°C | 2 Hours |

During routine environmental monitoring, the temperature in Cold Storage Room CR-02 was observed at 12.5°C, exceeding the approved storage range of 2°C to 8°C for approximately two hours. The materials stored in the area were immediately placed on hold pending investigation and impact assessment.
""".strip(),
    "investigationFindings": """
Example:
Input Content:
Machine stopped due to overload

Output:
The investigation determined that the equipment shutdown was triggered by an overload condition that exceeded the validated operating range of the machine. Review of the equipment log and operator activity indicated that the load was not balanced before start-up, causing abnormal resistance during operation. Based on the available evidence, the most probable root cause was inadequate adherence to the defined operating setup procedure.
""".strip(),
    "impact": """
Example:
Input Content:
Temperature excursion in storage room for 2 hours

Output:
The deviation may have affected the storage condition of the quarantined materials and therefore has a potential impact on product quality. A batch-wise assessment is required to determine whether any material was exposed beyond its qualified stability limits. There is no immediate evidence of patient safety impact; however, the event represents a GMP compliance risk until disposition is completed and supporting temperature mapping and product stability data are reviewed.
""".strip(),
    "table_example": """
Example Table Output:
| Field | Value |
| --- | --- |
| Deviation ID | DEV-001 |
| Status | Quarantined |
""".strip(),
}

def build_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS[field_type]
    few_shot_example = FEW_SHOT_EXAMPLES[field_type]
    normalized_user_prompt = (user_prompt or "").strip()

    # If the user asks for an explicit word count, make it unambiguous for the model.
    word_count_hint = ""
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
