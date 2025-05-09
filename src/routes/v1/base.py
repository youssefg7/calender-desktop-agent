from fastapi import APIRouter, status
from fastapi.responses import ORJSONResponse


base_router = APIRouter(
    prefix="/api/v1",
    tags=["api_v1"],
)


@base_router.get("", response_class=ORJSONResponse, status_code=status.HTTP_200_OK)
async def welcome():
    """
    Check the status of the application.
    This endpoint returns a welcome message along with the application name and version.
    """

    return {
        "message": "Welcome to the calendar agent",
        "app_name": "Simple Calender Agent",
        "version": "0.0.1",
    }
