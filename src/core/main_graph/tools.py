from typing import List, Optional
from datetime import datetime, timezone, timedelta
from dateutil import parser as date_parser

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import pickle
from langgraph.types import StreamWriter
from langchain_core.tools.base import InjectedToolArg
from typing_extensions import Annotated
from langchain_core.tools import tool
import orjson
from difflib import SequenceMatcher
from typing import Tuple
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
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'assets/OAuth Client ID mcp-test.json', PEOPLE_SCOPES)
                creds = flow.run_local_server(port=0)
            except Exception as e:
                print(f"Error getting user people service: {e}")
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
    "get_event_tool": "Checking your calendar...📅",
    "find_free_time_tool": "Looking for free time in your calendars...⏰",
    "find_similar_contacts_tool": "Looking for matching contacts..🔍",
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
    return_message = f"Event created successfully.\n\n{orjson.dumps(created_event, option=orjson.OPT_INDENT_2)}"
    if attendees:
        return_message += f"\n\nSent email to attendees: {orjson.dumps(created_event['attendees'], option=orjson.OPT_INDENT_2)}"
    return return_message

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
        return_message += f"\n\nSent email to attendees: {result['attendees']}"
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
    # Convert input dates to date objects
    start_date_obj = date_parser.parse(start_date).date()
    end_date_obj = date_parser.parse(end_date).date()
    # RFC3339 datetime strings for API
    time_min = datetime.combine(start_date_obj, datetime.min.time()).isoformat() + 'Z'
    # timeMax is exclusive, so use the day after end_date
    time_max = datetime.combine(end_date_obj + timedelta(days=1), datetime.min.time()).isoformat() + 'Z'
    print(f"will search for free time between {time_min} and {time_max}")
    for cal_id in target_calendar_ids:
        events_result = service.events().list(
            calendarId=cal_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime',
        ).execute()
        all_events.extend(events_result.get('items', []))
    # Sort events by start date (ignore time)
    def get_event_start(event):
        return date_parser.parse(event['start'].get('dateTime', event['start'].get('date'))).date()
    all_events.sort(key=get_event_start)
    print(f"found {len(all_events)} events")
    # Truncate input start and end to date (midnight)
    current_time = start_date_obj
    free_slots = []
    for event in all_events:
        event_start = date_parser.parse(event['start'].get('dateTime', event['start'].get('date'))).date()
        # Check if there's enough free time before this event starts
        days_free = (event_start - current_time).days
        if days_free * 1440 >= duration_minutes:
            slot_start = current_time.isoformat()
            slot_end = (event_start - timedelta(days=1)).isoformat() if days_free > 0 else slot_start
            free_slots.append({'start': slot_start, 'end': slot_end, 'days': days_free})
        # Move current time to the end of this event
        event_end = date_parser.parse(event['end'].get('dateTime', event['end'].get('date'))).date()
        current_time = max(current_time, event_end)
    # Check if there's free time after the last event
    days_free = (time_max - current_time).days
    if days_free * 1440 >= duration_minutes:
        slot_start = current_time.isoformat()
        slot_end = time_max.isoformat()
        free_slots.append({'start': slot_start, 'end': slot_end, 'days': days_free})
    if not free_slots:
        return "No free time slots found that meet the criteria."
    result = "Available time slots (by day):\n" + "\n".join([
        f"{slot['start']} to {slot['end']} ({slot['days']} days)"
        for slot in free_slots if slot['days'] > 0
    ])
    return result

@tool(parse_docstring=True)
def find_similar_contacts_tool(name: str, top_n: int = 2) -> Tuple[List[dict], bool]:
    """
    Search for similar names in user's contacts and return top matches.
    
    Args:
        name (str): Name to search for in user's contacts.
        top_n (int, optional): Number of top matches to return. Defaults to 2.
    """
    print(f"Searching for contacts similar to: {name}")
    try:
        service = get_user_people_service()
        all_contacts = []
        next_page_token = None
        page_count = 0
        
        # Fetch all contacts
        while True:
            page_count += 1
            print(f"\nFetching contacts page {page_count}...")
            try:
                results = service.people().connections().list(
                    resourceName='people/me',
                    pageSize=1000,
                    pageToken=next_page_token,
                    personFields='names,emailAddresses'
                ).execute()
                
                connections = results.get('connections', [])
                print(f"Found {len(connections)} contacts on this page")
                
                for person in connections:
                    names = person.get('names', [])
                    emails = person.get('emailAddresses', [])
                    
                    # Log the raw contact data for debugging
                    print(f"\nProcessing contact:")
                    print(f"Names: {names}")
                    print(f"Emails: {emails}")
                    
                    # Process contact even if it only has a name
                    if names:
                        display_name = names[0].get('displayName', '')
                        email = emails[0].get('value', '') if emails else 'No email'
                        contact_info = {
                            'name': display_name,
                            'email': email
                        }
                        all_contacts.append(contact_info)
                        print(f"Added contact: {display_name} <{email}>")
                    else:
                        print("Skipping contact: No name found")
                
                next_page_token = results.get('nextPageToken')
                if not next_page_token:
                    print("No more pages to fetch")
                    break
                    
            except Exception as e:
                print(f"Error fetching page {page_count}: {str(e)}")
                break
        
        print(f"\nTotal contacts fetched: {len(all_contacts)}")
        print("All contacts:")
        for contact in all_contacts:
            print(f"- {contact['name']} <{contact['email']}>")
        
        if not all_contacts:
            print("No contacts found in the system")
            return [], False
        # Split search name into parts
        search_parts = [p for p in name.lower().split() if p]
        print(f"\nSearch name parts: {search_parts}")
        # Calculate similarity scores with improved matching
        print("\nCalculating similarity scores:")
        for contact in all_contacts:
            contact_name = contact['name'].lower()
            contact_parts = [p for p in contact_name.split() if p]
            # Calculate full name similarity
            full_name_similarity = SequenceMatcher(None, name.lower(), contact_name).ratio()
            # Calculate part similarity: only count strong partial matches (substring of at least 3 chars)
            part_matches = 0
            for search_part in search_parts:
                for contact_part in contact_parts:
                    if search_part == contact_part:
                        part_matches += 1
                        break
                    elif len(search_part) >= 3 and len(contact_part) >= 3 and (search_part in contact_part or contact_part in search_part):
                        part_matches += 0.5  # partial match, but not full
                        break
            part_similarity = part_matches / max(len(search_parts), len(contact_parts), 1)
            # Final similarity: max of full name similarity and part similarity, but only 1 if exact match
            if name.strip().lower() == contact_name.strip().lower():
                similarity = 1.0
            else:
                similarity = max(full_name_similarity, part_similarity)
                # Cap similarity to <1 if not exact
                if similarity > 0.99:
                    similarity = 0.99
            contact['similarity'] = similarity
            print(f"Contact: {contact['name']} - Similarity: {contact['similarity']:.2f}")
        # Filter by similarity threshold first
        matches = [contact for contact in all_contacts if contact['similarity'] > 0.2]
        # Then sort and get top N matches
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        top_matches = matches[:top_n]
        if not top_matches:
            print(f"\nNo similar contacts found for: {name}")
            return [], False
        print(f"\nFound {len(top_matches)} similar contacts:")
        for match in top_matches:
            print(f"- {match['name']} ({match['email']}) - Similarity: {match['similarity']:.2f}")
        return top_matches, True
    except Exception as e:
        print(f"Error searching contacts: {str(e)}")
        raise

