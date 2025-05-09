from .states import InputState, OverallState
from langchain_core.messages import AIMessage

def continue_with_validator_decision(state: OverallState) -> str:
    return state.is_valid_user_input


def continue_with_tool_call(state: OverallState):
    last_message: AIMessage = state.main_agent_messages[-1]
    if last_message.tool_calls:
        return "TOOL"
    return "NO_TOOL"
