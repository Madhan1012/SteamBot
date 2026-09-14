from fastapi import APIRouter, HTTPException
from app.schema.chat import ChatRequest, ChatResponse
from app.core.engine import AegisEngine

router = APIRouter()
engine = AegisEngine()

@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):

    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty!")

    response = engine.process_message(request)

    if response.error:
        print(f"\n---------- {response.error} ----------\n")
        raise HTTPException(status_code=500, detail=response.error)
        
    return response