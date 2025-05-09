from helpers import get_settings
from core import get_compiled_graph
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import ORJSONResponse
from models.request_models import QueryRequest
from .dependencies import get_chat_controller

app_settings = get_settings()


chat_router = APIRouter(
    prefix="/api/v1/chat",
    tags=["api_v1", "chat"],
)


@chat_router.post("", response_class=ORJSONResponse, status_code=status.HTTP_200_OK)
async def chat(
    query: QueryRequest,
    conversation_id: str = Header(None),
):
    if conversation_id is None:
        conversation_id = await chat_controller.new_conversation()
    response = await chat_controller.chat_message(conversation_id, query.query_text)
    return {"response": response, "conversation_id": conversation_id}
