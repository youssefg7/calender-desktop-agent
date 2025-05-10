from typing import List, Optional
from datetime import datetime, timezone
from dateutil import parser as date_parser

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import orjson
import pickle
from langgraph.types import StreamWriter
from langchain_core.tools.base import InjectedToolArg
from typing_extensions import Annotated
from langchain_core.tools import tool
import orjson
# ---- Helper to get Google Calendar service for the user ----

SCOPES = ['https://www.googleapis.com/auth/calendar']
PEOPLE_SCOPES = ['https://www.googleapis.com/auth/contacts.readonly']


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

def get_user_people_service():
    """
    Returns an authorized Google People API service instance for the user using OAuth2.
    Requires client_secret.json in the working directory.
    """
    creds = None
    if os.path.exists('token_people.pickle'):
        with open('token_people.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'assets/OAuth Client ID mcp-test.json', PEOPLE_SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token_people.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('people', 'v1', credentials=creds)
    return service

# ---- Tool Functions ----

TOOLS_MESSAGES = {
    "create_event_tool": "Creating event...📝",
    "delete_event_tool": "Deleting event...🗑️",
    "edit_event_tool": "Editing event...✏️",
    "get_all_events_tool": "Checking your calendar...📅",
    "get_all_calendar_ids_tool": "Checking your calendars...📆",
    "search_contacts_by_name_tool": "Searching in your contacts...🔍",
    "get_event_tool": "Checking your calendar...📅",
    "find_free_time_tool": "Looking for free time in your calendars...⏰",
}


@tool(parse_docstring=True)
def create_event_tool(
    summary: str,
    start: str,
    end: str,
    calendar_id: str = 'primary',
    description: Optional[str] = None,
    location: Optional[str] = None,
    color_id: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    recurrence: Optional[str] = None,
):
    """
    Creates a new event in Google Calendar. You should check the user's calendar for availability before creating a new event.

    Args:
        summary (str): Title of the event.
        start (str): Start date and time in ISO 8601 format (e.g., '2025-04-02T10:00:00-07:00').
        end (str): End date and time in ISO 8601 format (e.g., '2025-04-02T11:00:00-07:00').
        calendar_id (str, optional): ID of the calendar to create the event in. Defaults to 'primary'.
        description (str, optional): Description of the event.
        location (str, optional): Physical location or address of the event.
        color_id (str, optional): Color identifier for the event.
        attendees (List[str], optional): List of email addresses to invite.
        recurrence (str, optional): RFC5545 recurrence rule (e.g., 'RRULE:FREQ=WEEKLY;COUNT=10').
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
    return f"Event created successfully.\n\n{orjson.dumps(created_event, option=orjson.OPT_INDENT_2)}"

@tool(parse_docstring=True)
def delete_event_tool(
    event_id: str, 
    calendar_id: str = 'primary',
    ):
    """
    Deletes an event from Google Calendar.

    Args:
        event_id (str): ID of the event to delete.
        calendar_id (str, optional): ID of the calendar containing the event. Defaults to 'primary'.
    """
    service = get_user_calendar_service()
    service.events().delete(
        calendarId=calendar_id,
        eventId=event_id,
        sendUpdates='all'
    ).execute()
    return f"Event {event_id} deleted successfully from calendar {calendar_id}"

@tool(parse_docstring=True)
def edit_event_tool(
    event_id: str,
    changes: dict,
    calendar_id: str = 'primary',
):
    """
    Updates an existing event in Google Calendar.

    Args:
        event_id (str): ID of the event to update.
        changes (dict): Dictionary of fields to update. Keys can include 'summary', 'description', 'start', 'end', 'location', 'colorId', 'attendees', 'recurrence'.
        calendar_id (str, optional): ID of the calendar containing the event. Defaults to 'primary'.
    """
    service = get_user_calendar_service()
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
    return_message = f"Event updated successfully: {orjson.dumps(result, option=orjson.OPT_INDENT_2)}"
    if 'attendees' in changes:
        return_message += f"\n\nSent email to attendees: {orjson.dumps(result['attendees'], option=orjson.OPT_INDENT_2)}"
    return return_message

@tool(parse_docstring=True)
def get_all_events_tool(
    limit: int = 10,
    calendar_ids: Optional[List[str]] = ['primary'],
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    q: Optional[str] = None,
    show_deleted: bool = False,
):
    """
    Lists events from Google Calendar.

    Args:
        limit (int, optional): Maximum number of events to return. Defaults to 10.
        calendar_ids (List[str], optional): List of calendar IDs to retrieve events from. Defaults to ['primary'].
        time_min (str, optional): Start date/time in ISO 8601 format. Defaults to now.
        time_max (str, optional): End date/time in ISO 8601 format.
        q (str, optional): Free text search term for events.
        show_deleted (bool, optional): Whether to include deleted events. Defaults to False.
    """
    service = get_user_calendar_service()
    if not time_min:
        time_min = datetime.now(tz=timezone.utc).isoformat()
    if not calendar_ids:
        calendar_ids = ['primary']
    events = []
    for calendar_id in calendar_ids:
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
        events.extend(events_result.get('items', []))
        
    if not events:
        return 'No upcoming events in the given time range and calendars.'
    return events

@tool(parse_docstring=True)
def get_all_calendar_ids_tool():
    """
    Retrieves all calendar IDs for the user.

    Args:
    """
    service = get_user_calendar_service()
    return service.calendarList().list().execute()

@tool(parse_docstring=True)
def search_contacts_by_name_tool(
    name: str, 
):
    """
    Searches Google Contacts by name using the People API.

    Args:
        name (str): Name to search for in Google Contacts.
    """
    service = get_user_people_service()
    results = service.people().connections().list(
        resourceName='people/me',
        pageSize=20,
        personFields='names,emailAddresses',
        requestMask_includeField='person.names,person.emailAddresses'
    ).execute()
    connections = results.get('connections', [])
    matches = []
    for person in connections:
        names = person.get('names', [])
        emails = person.get('emailAddresses', [])
        if names and emails:
            display_name = names[0].get('displayName', '')
            email = emails[0].get('value', '')
            if name.lower() in display_name.lower():
                matches.append(f"{display_name} <{email}>")
    if not matches:
        return f"No contacts found matching '{name}'."
    return '\n'.join(matches)

@tool(parse_docstring=True)
def get_event_tool(
    event_id: str, 
    calendar_id: str = 'primary',
):
    """
    Retrieves a single event from Google Calendar by event ID.

    Args:
        event_id (str): ID of the event to retrieve.
        calendar_id (str, optional): ID of the calendar containing the event. Defaults to 'primary'.
    """
    service = get_user_calendar_service()
    event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
    return event


@tool(parse_docstring=True)
def find_free_time_tool(
    start_date: str,
    end_date: str,
    duration_minutes: int,
    calendar_ids: Optional[List[str]] = None,
):
    """
    Finds available free time slots between events in one or more Google Calendars.

    Args:
        start_date (str): Start of the search period (ISO 8601 format).
        end_date (str): End of the search period (ISO 8601 format).
        duration_minutes (int): Minimum slot duration in minutes.
        calendar_ids (List[str], optional): List of calendar IDs to check. If not provided, uses the primary calendar.
    """
    service = get_user_calendar_service()
    target_calendar_ids = calendar_ids or ['primary']
    all_events = []
    for cal_id in target_calendar_ids:
        events_result = service.events().list(
            calendarId=cal_id,
            timeMin=start_date,
            timeMax=end_date,
            singleEvents=True,
            orderBy='startTime',
        ).execute()
        all_events.extend(events_result.get('items', []))
    # Sort events by start time
    def get_event_start(event):
        return date_parser.parse(event['start'].get('dateTime', event['start'].get('date')))
    all_events.sort(key=get_event_start)
    duration_ms = duration_minutes * 60 * 1000
    current_time = date_parser.parse(start_date)
    end_time = date_parser.parse(end_date)
    free_slots = []
    for event in all_events:
        event_start = date_parser.parse(event['start'].get('dateTime', event['start'].get('date')))
        if (event_start - current_time).total_seconds() * 1000 >= duration_ms:
            slot_start = current_time.isoformat()
            slot_end = event_start.isoformat()
            free_slots.append({'start': slot_start, 'end': slot_end})
        event_end = date_parser.parse(event['end'].get('dateTime', event['end'].get('date')))
        current_time = max(current_time, event_end)
    if (end_time - current_time).total_seconds() * 1000 >= duration_ms:
        slot_start = current_time.isoformat()
        slot_end = end_time.isoformat()
        free_slots.append({'start': slot_start, 'end': slot_end})
    if not free_slots:
        return "No free time slots found that meet the criteria."
    result = "Available time slots:\n" + "\n".join([
        f"{date_parser.parse(slot['start']).strftime('%Y-%m-%d %H:%M:%S')} - {date_parser.parse(slot['end']).strftime('%Y-%m-%d %H:%M:%S')} "
        f"({round((date_parser.parse(slot['end']) - date_parser.parse(slot['start'])).total_seconds() / 60)} minutes)"
        for slot in free_slots
    ])
    return result

@tool(parse_docstring=True)
def check_conflict_tool(
    event1_start: str,
    event1_end: str,
    event2_start: str,
    event2_end: str,
):
    """
    Checks if two events conflict (overlap) based on their start and end times.

    Args:
        event1_start (str): Start datetime of the first event in ISO 8601 format (e.g., '2025-05-10T10:00:00').
        event1_end (str): End datetime of the first event in ISO 8601 format.
        event2_start (str): Start datetime of the second event in ISO 8601 format.
        event2_end (str): End datetime of the second event in ISO 8601 format.

    Returns:
        str: Message indicating if the events conflict and the overlapping period if applicable.
    """
    start1 = date_parser.parse(event1_start)
    end1 = date_parser.parse(event1_end)
    start2 = date_parser.parse(event2_start)
    end2 = date_parser.parse(event2_end)

    if end1 <= start2 or end2 <= start1:
        return "✅ No conflict: The two events do not overlap."

    # Compute overlap
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)
    overlap_duration = (overlap_end - overlap_start).total_seconds() / 60

    return (
        f"⚠️ Conflict detected!\n"
        f"Overlap: {overlap_start.strftime('%Y-%m-%d %H:%M')} to {overlap_end.strftime('%Y-%m-%d %H:%M')} "
        f"({round(overlap_duration)} minutes)"
    )



