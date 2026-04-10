from fastapi import APIRouter
from app.domains.ai_enhancement.models import AIRefineRequest, AIRefineResponse
from app.domains.ai_enhancement.services.refine_service import refine_qms_content

router = APIRouter()

@router.post("/ai/refine", response_model=AIRefineResponse)
def refine_content(payload: AIRefineRequest) -> AIRefineResponse:
    """Entry point for DVMS field refinement."""
    generated_text = refine_qms_content(payload)
    return AIRefineResponse(success=True, generatedText=generated_text)
