from typing import Optional, List, Union
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    description: Optional[str] = Field(None, description="The textual description of the deviation.")
    rootCauses: Optional[Union[str, List[str]]] = Field(None, description="The identified root causes of the deviation.")
    threshold: float = Field(35.0, description="Similarity score threshold for filtering results.")
    limit: int = Field(5, description="Maximum number of similar deviations to return.")
    startDate: Optional[str] = Field(None, description="Start date for filtering in YYYY-MM-DD format.")
    endDate: Optional[str] = Field(None, description="End date for filtering in YYYY-MM-DD format.")

class SimilarDeviation(BaseModel):
    id: int
    matchScore: float
    descriptionMatch: Optional[float] = None
    rootCauseMatch: Optional[float] = None
    deviationNo: Optional[str] = None
    investigationId: Optional[int] = None
    description: Optional[str] = None
    rootCauses: Optional[Union[str, List[str]]] = None
    payload: Optional[dict] = None

class AnalysisResponse(BaseModel):
    status: str = "success"
    message: str = "Analysis completed successfully"
    data: dict
    # We use a dict for data to match the existing dynamic response format

class KnowledgeItem(BaseModel):
    id: int
    description: str
    rootCauses: Union[str, List[str]]
    initiationDate: Optional[str] = None

class AddKnowledgeRequest(BaseModel):
    items: Union[KnowledgeItem, List[KnowledgeItem]]
