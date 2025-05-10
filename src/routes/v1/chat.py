from typing import AsyncGenerator

import orjson
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import ORJSONResponse, StreamingResponse

from langgraph.graph.state import CompiledStateGraph
from langgraph.types import StateSnapshot
import uuid 
from core.main_graph import get_compiled_graph
from core.main_graph.states import InputState
from database import (
    LangfuseHandler,
)
from helpers import get_settings

app_settings = get_settings()


chat_router = APIRouter(
    prefix="/api/v1/chat",
    tags=["api_v1", "chat"],
)


@chat_router.post("/start-chat")
async def start_chat(
    user_message: str,
    graph: CompiledStateGraph = Depends(get_compiled_graph),
):
    conversation_id = str(uuid.uuid4())
    langfuse_handler = LangfuseHandler()
    trace, callback_handler = langfuse_handler.get_callback_handler()
    graph_config = {
        "configurable": {"thread_id": conversation_id},
        "callbacks": [callback_handler],
    }
    return StreamingResponse(
        status_code=status.HTTP_200_OK,
        content=start_graph_execution(
            graph_config=graph_config,
            graph=graph,
            user_message=user_message,
        ),
        media_type="text/event-stream",
    )
    
    
@chat_router.post("/")
async def chat(
    user_message: str,
    thread_id: str = Header(),
    graph: CompiledStateGraph = Depends(get_compiled_graph),
):
    langfuse_handler = LangfuseHandler()
    trace, callback_handler = langfuse_handler.get_callback_handler()
    graph_config = {
        "configurable": {"thread_id": thread_id},
        "callbacks": [callback_handler],
    }

    return StreamingResponse(
        status_code=status.HTTP_200_OK,
        content=followup_graph(
            user_input=user_message,
            graph_config=graph_config,
            graph=graph,
        ),
        media_type="text/event-stream",
    )
        
        
async def start_graph_execution(
    graph_config: dict,
    graph: CompiledStateGraph,
    user_message: str,
) -> AsyncGenerator[str, None]:
    
    response = {
        "op": "trace_id",
        "trace_id": graph_config["configurable"]["thread_id"],
    }
    print(response)
    yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    
    response = {
        "op": "info",
        "message": "Thinking...",
    }
    yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"


    async for update in graph.astream(
        input=InputState(user_message=user_message),
        config=graph_config,
        stream_mode=["custom"],
    ):
        response = {
            "op": "info",
            "message": update[1],
        }
        print(response)
        if response:
            yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    final_state = await graph.aget_state(config=graph_config)
    async for response in generate_response(final_state):
        yield response
        
# Extracts the response from the final state
async def generate_response(final_state: StateSnapshot) -> AsyncGenerator[str, None]:
    response = {
        "op": "final_generated",
        "message": final_state.values["main_agent_messages"][-1].content,
    }
    yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"


async def followup_graph(
    user_input: str,
    graph_config: dict,
    graph: CompiledStateGraph,
) -> AsyncGenerator[str, None]:
    response = {
        "op": "info",
        "message": "Thinking...",
    }
    yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    async for update in graph.astream(
        input=InputState(user_message=user_input), config=graph_config, stream_mode=["custom"]
    ):
        response = {"op": "info", "message": update[1]}
        if response:
            yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    final_state = await graph.aget_state(config=graph_config, subgraphs=True)
    async for response in generate_response(final_state):
        yield response