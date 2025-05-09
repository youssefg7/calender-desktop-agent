from typing import AsyncGenerator

import orjson
from fastapi import APIRouter, Depends, Header, status
from fastapi.responses import ORJSONResponse, StreamingResponse

from langgraph.graph.state import CompiledStateGraph
from langgraph.types import StateSnapshot
from langchain_core.messages import HumanMessage

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
    langfuse_handler = LangfuseHandler()
    trace, callback_handler = langfuse_handler.get_callback_handler()
    graph_config = {
        "configurable": {"thread_id": trace.trace_id},
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
    
    
@chat_router.post("/chat")
async def chat(
    user_message: str,
    trace_id: str = Header(),
    graph: CompiledStateGraph = Depends(get_compiled_graph),
):
    langfuse_handler = LangfuseHandler()
    trace, callback_handler = langfuse_handler.get_callback_handler(trace_id=trace_id)
    graph_config = {
        "configurable": {"thread_id": trace.trace_id},
        "callbacks": [callback_handler],
    }

    current_state = await graph.aget_state(config=graph_config, subgraphs=True)
    if "ask_user_data" not in current_state.tasks[0].state.next:
        return ORJSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "message": "Invalid request. The current state does not require user input."
            },
        )
        
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
            "message": update[2],
        }
        if response:
            yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    final_state = await graph.aget_state(config=graph_config, subgraphs=True)
    async for response in generate_response(final_state):
        yield response
        
# Extracts the response from the final state
async def generate_response(final_state: StateSnapshot) -> AsyncGenerator[str, None]:
    # Follow-up question to the user
    if final_state.tasks:
        if final_state.tasks[0].state.next[0] == "ask_user_data":
            response = {
                "op": "ask_user_data",
                "message": final_state.tasks[0]
                .state.values["user_data_messages"][-1]
                .content,
            }
            yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"
    else:
        # Final Report Generated
        response = {
            "op": "final_generated",
        }
        yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"


async def followup_graph(
    user_input: str,
    graph_config: dict,
    graph: CompiledStateGraph,
) -> AsyncGenerator[str, None]:

    state = await graph.aget_state(config=graph_config, subgraphs=True)
    await graph.aupdate_state(
        config=state.tasks[0].state.config,
        values={
            "user_data_messages": [HumanMessage(content=user_input)],
        },
        as_node="ask_user_data",
    )
    async for update in graph.astream(
        None, config=graph_config, subgraphs=True, stream_mode=["custom"]
    ):
        response = {"op": "info", "message": update[2]}
        if response:
            yield f"data: {orjson.dumps(response).decode('utf-8')}\n\n"

    final_state = await graph.aget_state(config=graph_config, subgraphs=True)
    async for response in generate_response(final_state):
        yield response