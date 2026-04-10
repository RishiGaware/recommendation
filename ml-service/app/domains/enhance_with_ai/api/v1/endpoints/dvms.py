from fastapi import APIRouter

from app.domains.enhance_with_ai.domains.dvms.schemas import AIRefineRequest, AIRefineResponse
from app.domains.enhance_with_ai.domains.dvms.services import refine_qms_content


router = APIRouter()


@router.post("/ai/refine", response_model=AIRefineResponse)
def refine_content(payload: AIRefineRequest) -> AIRefineResponse:
    generated_text = refine_qms_content(payload)
    return AIRefineResponse(success=True, generatedText=generated_text)

