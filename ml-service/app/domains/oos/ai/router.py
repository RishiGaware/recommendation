from fastapi import APIRouter
from app.domains.oos.ai.service import refine_oos_content, OOSAIRefineRequest

router = APIRouter()

@router.post("/refine")
def refine_content(payload: OOSAIRefineRequest):
    """Refinement endpoint for OOS."""
    generated_text = refine_oos_content(payload)
    return {"success": True, "generatedText": generated_text}
