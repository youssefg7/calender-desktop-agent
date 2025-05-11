from pydantic import BaseModel, Field


class ValidatorDecision(BaseModel):
    valid: bool = Field(..., description="True if valid, False if invalid")
    response: str = Field(None, description="Response to invalid user message")


class EventModel(BaseModel):
    type: str = Field(..., description="Type of event new/deleted/edited/existing")
    metadata: dict = Field(..., description="All metadata of the event")


class MainAgentResponse(BaseModel):
    response: str = Field(..., description="Response to user message")
    events: list[EventModel] = Field(
        ..., description="List of events to be displayed to the user"
    )
