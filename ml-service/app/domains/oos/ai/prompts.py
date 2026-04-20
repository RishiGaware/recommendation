from typing import Dict

SYSTEM_PROMPT = """
You are an expert in Pharmaceutical Quality Assurance and Laboratory Investigations, specializing in Out of Specification (OOS) processes.

Your goal is to assist in documenting OOS events with high scientific accuracy, data integrity, and GMP (Good Manufacturing Practice) compliance.

RULES:
- Preserve all technical measurements, units, and limit specifications exactly.
- Use scientific, objective, and forensic language.
- Ensure a logical sequence of laboratory and manufacturing events.
- Strictly mirror any Batch IDs, Sample IDs, Equipment IDs, or Analyst names mentioned.
- Adhere to the FDA/MHRA guidelines for OOS investigations.
""".strip()

FIELD_INSTRUCTIONS: Dict[str, str] = {
    "oosDescription": "Generates a clear, technical description of the OOS event, including the test performed, the initial result vs. the specification limit, and the instrument used.",
    "investigationFindings": "Summarizes the results of the laboratory and/or manufacturing investigation, including analyst interviews, glassware inspection, and instrument performance checks.",
    "impactAssessment": "Drafts a technical assessment of the potential impact on other batches, stability studies, and product quality/safety based on the OOS finding.",
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
