import asyncio
import os
import time

from langfuse import Langfuse
from langfuse.callback.langchain import LangchainCallbackHandler
from langfuse.client import StatefulTraceClient
from langgraph.graph import END, START, StateGraph

from database import get_redis_saver
from helpers import get_settings

from .collect_sections_node import collect_sections
from .conditional_edges import continue_to_next_section
from .nodes import plan_template_node
from .states import InputState, OutputState, OverallState

app_settings = get_settings()


builder = StateGraph(state_schema=OverallState, input=InputState, output=OutputState)

# Nodes
builder.add_node("plan_template_node", plan_template_node)
builder.add_node("section_subgraph", compiled_section_graph)
builder.add_node("collect_sections", collect_sections)

# Edges
builder.add_edge(START, "plan_template_node")
builder.add_conditional_edges(
    "plan_template_node",
    continue_to_next_section,
    {
        "section_subgraph": "section_subgraph",
        "FINALIZE_REPORT": "collect_sections",
    },
)
builder.add_edge(
    "section_subgraph", "collect_sections"
)  ## TODO: Fix this (temporarily done to test)
builder.add_edge("collect_sections", END)

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


async def main():
    graph_time = str(time.strftime("%Y-%m-%d-%H-%M-%S"))

    output_folder = os.path.join("output/pdf", graph_time)
    os.makedirs(output_folder, exist_ok=True)
    output_pdf_path = os.path.join(output_folder, "output.pdf")

    trace, langfuse_handler = get_callback_handler()
    USER_INPUT = "Drivers tasks quarterly report"
    APP_ID = 1
    TENANT_ID = 1
    DATA_SOURCE = f"MYSQL_{APP_ID}_{TENANT_ID}"
    GRAPH_CONFIG = {
        "configurable": {"thread_id": trace.id},
        "callbacks": [langfuse_handler],
    }
    async for checkpoiner in get_redis_saver():
        compile_graph(checkpoiner=checkpoiner)
        graph = get_compiled_graph()
        async for update in graph.astream(
            input=OverallState(
                data_file_path=DATA_SOURCE,
                user_input=USER_INPUT,
                output_pdf_path=output_pdf_path,
            ),
            config=GRAPH_CONFIG,
            subgraphs=True,
        ):
            pass

        while True:
            is_satisfied = input("Is this the data needed for the report? (Y/N): ")
            if is_satisfied == "Y":
                state = graph.get_state(config=GRAPH_CONFIG, subgraphs=True)
                graph.update_state(
                    config=state.tasks[0].state.config,
                    values={"is_human_satisfied": True},
                    as_node="user_feedback",
                )
                async for update in graph.astream(
                    None, config=GRAPH_CONFIG, subgraphs=True
                ):
                    pass
                break
            else:
                follow_up_query = input("Enter follow up prompt: ")
                state = graph.get_state(config=GRAPH_CONFIG, subgraphs=True)
                graph.update_state(
                    config=state.tasks[0].state.config,
                    values={"latest_follow_up_input": follow_up_query},
                    as_node="user_feedback",
                )
                async for update in graph.astream(
                    None, config=GRAPH_CONFIG, subgraphs=True
                ):
                    pass
        break


if __name__ == "__main__":
    asyncio.run(main=main())
