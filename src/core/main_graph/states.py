import operator
from typing import Annotated

from pydantic import BaseModel
from langchain_core.messages import BaseMessage


class InputState(BaseModel):
    user_message: str


class OverallState(BaseModel):
    user_message: str
    is_valid_user_input: bool = False
    main_agent_messages: Annotated[list[BaseMessage], operator.add] = []
    validator_messages: Annotated[list[BaseMessage], operator.add] = []
    validator_decision: bool = True
    response: str = None
    tool_calls_left: int = 5


class OutputState(BaseModel):
    response: str
