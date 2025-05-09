from langfuse import Langfuse
from langfuse.callback.langchain import LangchainCallbackHandler
from langfuse.client import StatefulTraceClient
from langgraph.graph import END, START, StateGraph

from helpers import get_settings

from .conditional_edges import continue_with_validator_decision, continue_with_tool_call
from .states import InputState, OutputState, OverallState
from .agents import validate_user_input, main_agent
from langgraph.prebuilt import ToolNode
from .tools import create_event_tool, delete_event_tool, get_all_events_tool, reorder_events_tool
app_settings = get_settings()


builder = StateGraph(state_schema=OverallState,
                     input=InputState, output=OutputState)

# Nodes
builder.add_node("validate_user_input", validate_user_input)
builder.add_node("main_agent", main_agent)
builder.add_node("tools", ToolNode([
    create_event_tool, 
    delete_event_tool,
    get_all_events_tool, 
    reorder_events_tool
    ], messages_key="main_agent_messages"))

# Edges
builder.add_edge(START, "validate_user_input")
builder.add_conditional_edges(
    "validate_user_input",
    continue_with_validator_decision,
    {
        True: "main_agent",
        False: END,
    },
)
builder.add_conditional_edges(
    "main_agent", 
    continue_with_tool_call, 
    {
        "TOOL": "tools", 
        "NO_TOOL": END
    }
)
builder.add_edge("tools", "main_agent")

builder.add_edge("main_agent", END)

# graph_image = builder.compile().get_graph().draw_mermaid_png()
# with open("graph.png", "wb") as f:
#     f.write(graph_image)


def compile_graph(checkpointer):
    global compiled_graph
    compiled_graph = builder.compile(checkpointer=checkpointer)


def get_compiled_graph():
    return compiled_graph


def get_callback_handler() -> tuple[StatefulTraceClient, LangchainCallbackHandler]:
    langfuse_client = Langfuse(
        public_key=app_settings.LANGFUSE_PK,
        secret_key=app_settings.LANGFUSE_SK,
        host=app_settings.LANGFUSE_HOST,
    )
    trace = langfuse_client.trace()
    langfuse_handler = trace.get_langchain_handler(update_parent=True)
    return trace, langfuse_handler


# async def main():
#     graph_time = str(time.strftime("%Y-%m-%d-%H-%M-%S"))

#     output_folder = os.path.join("output/pdf", graph_time)
#     os.makedirs(output_folder, exist_ok=True)
#     output_pdf_path = os.path.join(output_folder, "output.pdf")

#     trace, langfuse_handler = get_callback_handler()
#     USER_INPUT = "Drivers tasks quarterly report"
#     APP_ID = 1
#     TENANT_ID = 1
#     DATA_SOURCE = f"MYSQL_{APP_ID}_{TENANT_ID}"
#     GRAPH_CONFIG = {
#         "configurable": {"thread_id": trace.id},
#         "callbacks": [langfuse_handler],
#     }
#     async for checkpoiner in get_redis_saver():
#         compile_graph(checkpoiner=checkpoiner)
#         graph = get_compiled_graph()
#         async for update in graph.astream(
#             input=OverallState(
#                 data_file_path=DATA_SOURCE,
#                 user_input=USER_INPUT,
#                 output_pdf_path=output_pdf_path,
#             ),
#             config=GRAPH_CONFIG,
#             subgraphs=True,
#         ):
#             pass

#         while True:
#             is_satisfied = input(
#                 "Is this the data needed for the report? (Y/N): ")
#             if is_satisfied == "Y":
#                 state = graph.get_state(config=GRAPH_CONFIG, subgraphs=True)
#                 graph.update_state(
#                     config=state.tasks[0].state.config,
#                     values={"is_human_satisfied": True},
#                     as_node="user_feedback",
#                 )
#                 async for update in graph.astream(
#                     None, config=GRAPH_CONFIG, subgraphs=True
#                 ):
#                     pass
#                 break
#             else:
#                 follow_up_query = input("Enter follow up prompt: ")
#                 state = graph.get_state(config=GRAPH_CONFIG, subgraphs=True)
#                 graph.update_state(
#                     config=state.tasks[0].state.config,
#                     values={"latest_follow_up_input": follow_up_query},
#                     as_node="user_feedback",
#                 )
#                 async for update in graph.astream(
#                     None, config=GRAPH_CONFIG, subgraphs=True
#                 ):
#                     pass
#         break


# if __name__ == "__main__":
#     asyncio.run(main=main())
