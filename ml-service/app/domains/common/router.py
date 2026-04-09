from fastapi import APIRouter, Body
from app.core.response_handler import standard_response
from app.domains.common.service import robust_text_extraction

router = APIRouter()

@router.post("/extract-text")
def extract_text(payload: dict = Body(...)):
    """
    Extracts plain text from raw HTML/XML strings.
    Specifically optimized for MSO Word exported content.
    """
    content = payload.get("content", "")
    
    if not content:
        return standard_response(
            status="error",
            message="No content provided",
            status_code=400
        )

    try:
        clean_text = robust_text_extraction(content)

        return standard_response(
            status="success",
            message="Text extracted successfully using robust ordering",
            data={
                "original_length": len(content),
                "extracted_length": len(clean_text),
                "text": clean_text
            }
        )
    except Exception as e:
        return standard_response(
            status="error",
            message=f"Extraction failed: {str(e)}",
            status_code=500
        )
