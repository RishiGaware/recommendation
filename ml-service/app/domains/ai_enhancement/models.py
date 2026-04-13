from typing import Literal
from pydantic import BaseModel, Field, field_validator

FieldType = Literal["description", "investigationFindings", "impact"]

class AIRefineRequest(BaseModel):
    fieldType: FieldType = Field(..., description="Target DVMS field to refine")
    value: str = Field(..., min_length=1, description="Existing field content or keywords")
    prompt: str = Field(..., min_length=1, description="User intent or instruction for refinement")

    @field_validator("value", "prompt")
    @classmethod
    def validate_non_empty_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Value cannot be empty or whitespace only.")
        return normalized

class AIRefineResponse(BaseModel):
    success: bool = True
    generatedText: str
