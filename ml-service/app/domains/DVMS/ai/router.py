from fastapi import APIRouter
from app.domains.dvms.ai.service import refine_dvms_content, DVMSAIRefineRequest

router = APIRouter()

@router.post("/refine")
def refine_content(payload: DVMSAIRefineRequest):
    """Refinement endpoint for DVMS."""
    generated_text = refine_dvms_content(payload)
    return {"success": True, "generatedText": generated_text}
