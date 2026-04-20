from typing import Optional, List, Union
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    description: Optional[str] = Field(None, description="The textual description of the record.")
    rootCauses: Optional[Union[str, List[str]]] = Field(None, description="The identified root causes.")
    threshold: float = Field(35.0, description="Similarity score threshold for filtering results.")
    limit: int = Field(5, description="Maximum number of similar records to return.")
    startDate: Optional[str] = Field(None, description="Start date for filtering in YYYY-MM-DD format.")
    endDate: Optional[str] = Field(None, description="End date for filtering in YYYY-MM-DD format.")
    phase: int = Field(1, description="The phase of the OOS (1 or 2). Default is 1.")

class SimilarRecord(BaseModel):
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

class KnowledgeItem(BaseModel):
    id: int
    description: str
    rootCauses: Union[str, List[str]]
    initiationDate: Optional[str] = None
    phase: int = Field(1, description="The phase of the OOS (1 or 2). Default is 1.")

class AddKnowledgeRequest(BaseModel):
    items: Union[KnowledgeItem, List[KnowledgeItem]]
