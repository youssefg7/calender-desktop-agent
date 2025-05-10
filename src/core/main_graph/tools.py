from typing import List, Optional
from datetime import datetime, timezone

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import orjson
import pickle
from langgraph.types import StreamWriter

# ---- Helper to get Google Calendar service for the user ----

SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_user_calendar_service():
    """
    Returns an authorized Google Calendar API service instance for the user using OAuth2.
    Requires client_secret.json in the working directory.
    """
    creds = None
    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    # If there are no (valid) credentials, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'assets/OAuth Client ID mcp-test.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('calendar', 'v3', credentials=creds)
    return service

# ---- Tool Functions ----

def create_event_tool(
    summary: str,
    start: str,
    end: str,
    calendar_id: str = 'primary',
    description: Optional[str] = None,
    location: Optional[str] = None,
    color_id: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    recurrence: Optional[str] = None
):
    """
    Create a new event in Google Calendar.
    Dates must be ISO 8601 strings (e.g., '2025-04-02T10:00:00-07:00').
    """
    service = get_user_calendar_service()
    event = {
        'summary': summary,
        'start': {'dateTime': start},
        'end': {'dateTime': end},
    }
    if description:
        event['description'] = description
    if location:
        event['location'] = location
    if color_id:
        event['colorId'] = color_id
    if attendees:
        event['attendees'] = [{'email': email} for email in attendees]
    if recurrence:
        event['recurrence'] = [recurrence]
    created_event = service.events().insert(
        calendarId=calendar_id,
        body=event,
        sendUpdates='all' if attendees else 'none'
    ).execute()
    return f"Event '{summary}' created with ID: {created_event['id']} in calendar: {calendar_id}"

def delete_event_tool(event_id: str, calendar_id: str = 'primary'):
    """
    Delete an event from Google Calendar.
    """
    service = get_user_calendar_service()
    service.events().delete(
        calendarId=calendar_id,
        eventId=event_id,
        sendUpdates='all'
    ).execute()
    return f"Event {event_id} deleted successfully from calendar {calendar_id}"

def edit_event_tool(
    event_id: str,
    changes: dict,
    calendar_id: str = 'primary'
):
    """
    Update an existing event. 'changes' is a dict with any of:
    summary, description, start, end, location, colorId, attendees, recurrence
    """
    service = get_user_calendar_service()
    # Get current event
    current_event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
    updated_event = {}
    if 'summary' in changes:
        updated_event['summary'] = changes['summary']
    if 'description' in changes:
        updated_event['description'] = changes['description']
    if 'location' in changes:
        updated_event['location'] = changes['location']
    if 'colorId' in changes:
        updated_event['colorId'] = changes['colorId']
    if 'start' in changes:
        updated_event['start'] = {'dateTime': changes['start']}
    if 'end' in changes:
        updated_event['end'] = {'dateTime': changes['end']}
    if 'attendees' in changes:
        updated_event['attendees'] = [{'email': email} for email in changes['attendees']]
    if 'recurrence' in changes:
        updated_event['recurrence'] = [changes['recurrence']]
    result = service.events().patch(
        calendarId=calendar_id,
        eventId=event_id,
        body=updated_event,
        sendUpdates='all' if 'attendees' in changes else 'none'
    ).execute()
    return f"Event updated successfully: '{result['summary']}'"

def get_all_events_tool(
    limit: int = 10,
    calendar_id: str = 'primary',
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    q: Optional[str] = None,
    show_deleted: bool = False
):
    """
    List upcoming events from Google Calendar.
    """
    service = get_user_calendar_service()
    if not time_min:
        time_min = datetime.now(tz=timezone.utc).isoformat()
    events_result = service.events().list(
        calendarId=calendar_id,
        maxResults=limit,
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime',
        q=q,
        showDeleted=show_deleted
    ).execute()
    events = events_result.get('items', [])
    if not events:
        return 'No upcoming events.'
    return events
    # return '\n'.join([
    #     f"{event.get('summary', 'No Title')} ({event['start'].get('dateTime', event['start'].get('date'))} - {event['end'].get('dateTime', event['end'].get('date'))}) - ID: {event['id']}"
    #     for event in events
    # ])

def reorder_events_tool():
    """
    Google Calendar does not support reordering events directly, as events are sorted by start time.
    This is a placeholder.
    """
    return "Reordering events is not supported by Google Calendar API. Events are always sorted by start time."


