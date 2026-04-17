from typing import Dict
import re

SYSTEM_PROMPT = """
You are a pharmaceutical Quality Management System (QMS) expert specializing in deviation documentation.

Your response MUST adhere to the principle of "LITERAL INTEGRITY":
- Follow GMP-compliant, audit-ready language.
- Be strictly based ONLY on the provided input content.
- NEVER assume, modify, reinterpret, or infer technical values (numbers, quantities, layers, IDs).
- CRITICAL: Technical specifications (e.g., "three layers", "04 nos", "Batch No") MUST be mirrored exactly. 
- Do NOT simplify technical data (e.g., if input says "three layers", do NOT write "double layers" even if you think it sounds better).
- Maintain 100% traceability of all facts from input.

STRICT FORMAT RULE:
- Default response is ALWAYS professional text paragraphs.
- Tables are ONLY permitted if explicitly requested in the User Requirement.
- If the user specifies structure (e.g., "5 paragraphs", "2 tables"), it MUST be followed EXACTLY.
- Do NOT merge, skip, or alter required structure.
- Tables and paragraphs must be clearly separated.

OUTPUT RULES:
- No explanations, no extra commentary.
- Return ONLY the final formatted content.
- Ensure response is suitable for regulatory audit review.

Failure to follow format or any change to technical numeric data is considered a Critical Failure.
""".strip()


FIELD_INSTRUCTIONS: Dict[str, str] = {
    "description": (
        "Generate or enhance a deviation description in strict GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        
        "CRITICAL DATA INTEGRITY (LITERAL MIRRORING):\n"
        "- Preserve ALL input data exactly (numbers, IDs, references, counts).\n"
        "- MANDATORY: Do NOT change packaging layer counts (e.g., if input says 'three layers', output MUST say 'three layers').\n"
        "- Do NOT change technical meaning (e.g., 2 layers must remain 2 layers).\n"
        "- Do NOT generalize, simplify, or approximate regulated content.\n"
        
        "WHEN USER SPECIFIES STRUCTURE:\n"
        "- If user asks for X paragraphs, provide exactly X paragraphs.\n"
        "- Generate a table ONLY if the word 'table' is explicitly mentioned.\n"
    ),
    "investigationFindings": (
        "Generate detailed investigation findings in professional GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        
        "CRITICAL DATA INTEGRITY (LITERAL MIRRORING):\n"
        "- Preserve ALL IDs, serial numbers, and technical references exactly.\n"
        "- MANDATORY: Mirror all forensic data (e.g., equipment IDs, PMI numbers, AR numbers).\n"
        "- Do NOT infer or guess the root cause; strictly describe what is documented in input.\n"
        "- Maintain a logical, evidence-based narrative without adding unverifiable assumptions.\n"
    ),
    "impact": (
        "Generate a professional impact assessment in strict GMP format.\n\n"
        "DEFAULT FORMAT (FALLBACK): Professional text paragraphs.\n\n"
        
        "CRITICAL RISK INTEGRITY:\n"
        "- Do NOT upgrade or downgrade the risk level discovered in the input.\n"
        "- Preserve ALL batch numbers, IDs, and compliance references exactly.\n"
        "- Focus on objective analysis of product quality, patient safety, and regulatory risk.\n"
        "- Mirror the disposition or hold status exactly as stated in the input.\n"
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
}


def build_refinement_prompt(field_type: str, user_input: str, user_prompt: str) -> str:
    field_instruction = FIELD_INSTRUCTIONS[field_type]
    few_shot_example = FEW_SHOT_EXAMPLES[field_type]
    normalized_user_prompt = (user_prompt or "").strip()

    # Detect explicit word count
    word_count_hint = ""
    match = re.search(r"\b(\d{1,3})\s*words?\b", normalized_user_prompt, flags=re.IGNORECASE)
    if match:
        n_words = int(match.group(1))
        if 1 <= n_words <= 500:
            word_count_hint = f"\nOutput Requirement:\n- Output exactly {n_words} words.\n"

    # Detect structure requirements
    structure_hint = ""
    table_requested = "table" in normalized_user_prompt.lower()
    para_requested = "paragraph" in normalized_user_prompt.lower()

    if table_requested:
        table_match = re.search(r"(\d+)\s*table", normalized_user_prompt.lower())
        if table_match:
            structure_hint += f"- Generate EXACTLY {table_match.group(1)} Markdown tables.\n"
        else:
            structure_hint += "- Include a Markdown table as requested.\n"

    if para_requested:
        para_match = re.search(r"(\d+)\s*paragraph", normalized_user_prompt.lower())
        if para_match:
            structure_hint += f"- Generate EXACTLY {para_match.group(1)} paragraphs of text.\n"

    # Explicit override message to force AI away from default if prompt is present
    override_notice = ""
    if normalized_user_prompt:
        if not table_requested:
            override_notice = "\n[CRITICAL OVERRIDE] Do NOT include any Markdown tables. Provide text paragraphs only.\n"
        else:
            override_notice = "\n[CRITICAL OVERRIDE] Follow the requested table/paragraph counts exactly. Ignore fallback formats.\n"

    return f"""
{override_notice}

Task:
{field_instruction}

User Requirement:
{normalized_user_prompt if normalized_user_prompt else "Refine the content as professional text paragraphs."}

Input Content:
{user_input}

Rules:
- THE USER REQUIREMENT IS THE ABSOLUTE HIGHEST PRIORITY.
- Return ONLY the relevant text content by default.
- You MUST follow structure EXACTLY (e.g., "5 paragraphs" = exactly 5 paragraphs).
- Only provide a Table if explicitly requested in the User Requirement (contains word 'table').
- Do NOT repeat the same table/data for each paragraph.
- Do NOT generate extra deviation IDs (e.g., DEV-001, 002) for a single input event.

LITERAL INTEGRITY RULES:
- Do NOT change or reinterpret technical values.
- If input says "three layers", use "three layers" exactly.
- Preserve all:
  - Numbers (e.g., 04 nos, three layers)
  - IDs (Batch No, AR No, Employee ID, PMI number)
  - Dates
  - Process names
- All identifiers MUST match the Input Content exactly. 
- Literal accuracy exceeds creative prose in priority.

FORMAT RULES:
- Paragraphs must be clearly separated by double newlines.
- Tables must be valid Markdown tables.
- Do NOT mix table + paragraph in same block.

STRICT VALIDATION:
- If format or data integrity is violated -> output is considered a failure.

Structure Details:
{structure_hint}
{word_count_hint}

Reference Example (for tone, not format):
{few_shot_example}
""".strip()
