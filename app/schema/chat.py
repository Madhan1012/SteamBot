from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        description = "Natural language query entered by user.",
        example = ["Show me the top rated action games under $30 released in 2022"]
    )


class DynamicEntities(BaseModel):

    title: Optional[str] = None
    developer: Optional[str] = None
    is_free: Optional[bool] = False
    price_max: Optional[float] = None
    price_min: Optional[float] = None
    year: Optional[int] = None
    sort_by: Optional[str] = "user_score"
    sort_order: Optional[str] = "DESC"


class ChatResponse(BaseModel):

    extracted_entities: Optional[DynamicEntities] = None
    sql_query: str
    results: List[Dict[str, Any]]
    error: Optional[str] = None
