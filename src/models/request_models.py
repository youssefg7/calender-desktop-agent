from .base import BaseSchema
from pydantic import Field, field_validator
import os
from helpers import get_settings
from fastapi import HTTPException
from enum import Enum


class QueryRequest(BaseSchema):
    query_text: str = Field(..., description="The query to send to the chatbot.")

    @field_validator("query_text")
    def validate_query_text(cls, value: str):
        if len(value.strip()) < 2:
            raise HTTPException(
                status_code=400, detail="Query text must be at least 2 characters long."
            )
        return value.strip()


