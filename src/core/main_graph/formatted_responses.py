from pydantic import BaseModel, Field


class ValidatorDecision(BaseModel):
    valid: bool = Field(..., description="True if valid, False if invalid")
    response: str = Field(None, description="Response to invalid user message")


class MainAgentResponse(BaseModel):
    response: str = Field(..., description="Response to user message")
