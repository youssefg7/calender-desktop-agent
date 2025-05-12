import operator
from typing import Annotated, List

from pydantic import BaseModel
from langchain_core.messages import BaseMessage


class InputState(BaseModel):
    user_message: str



class OverallState(BaseModel):
    user_message: str
    main_agent_messages: Annotated[list[BaseMessage], operator.add] = []
    validator_messages: Annotated[list[BaseMessage], operator.add] = []
    is_valid_user_input: bool = False
    response: str = None
    tool_calls_left: int = 5
    contact_matches: List[dict] = []


class OutputState(BaseModel):
    response: str
