import operator
from typing import Annotated, Any, Dict

from pydantic import BaseModel
from langchain_core.messages import BaseMessage


class InputState(BaseModel):
    user_message: str


class OverallState(BaseModel):
    user_message: str
    main_agent_messages: Annotated[list[BaseMessage], operator.add] = []
    validator_messages: Annotated[list[BaseMessage], operator.add] = []
    validator_decision: bool = True
    response: str = None
    tool_calls_left: int = 1


class OutputState(BaseModel):
    response: str
