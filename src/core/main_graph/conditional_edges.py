from .states import InputState, OverallState
from langchain_core.messages import AIMessage
from langgraph.types import StreamWriter
from .tools import TOOLS_MESSAGES


def continue_with_validator_decision(state: OverallState) -> str:
    return True


def continue_with_tool_call(state: OverallState, writer: StreamWriter):
    last_message: AIMessage = state.main_agent_messages[-1]
    if last_message.tool_calls:
        if last_message.tool_calls[0]["name"] in TOOLS_MESSAGES:
            writer(TOOLS_MESSAGES[last_message.tool_calls[0]["name"]])
        return "TOOL"
    return "NO_TOOL"
