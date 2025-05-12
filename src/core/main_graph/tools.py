from typing import List, Optional, Tuple
from datetime import datetime, timezone
from difflib import SequenceMatcher

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os
import pickle
from langgraph.types import StreamWriter

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
    print("Starting People API authentication...")
    creds = None
    if os.path.exists('token_people.pickle'):
        print("Found existing token_people.pickle")
        with open('token_people.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        print("No valid credentials found, starting OAuth flow...")
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing expired credentials...")
            creds.refresh(Request())
        else:
            print("Starting new OAuth flow...")
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    'assets/OAuth Client ID mcp-test.json', PEOPLE_SCOPES)
                creds = flow.run_local_server(port=0)
                print("OAuth flow completed successfully")
            except Exception as e:
                print(f"Error during OAuth flow: {str(e)}")
                raise
        print("Saving credentials to token_people.pickle")
        with open('token_people.pickle', 'wb') as token:
            pickle.dump(creds, token)
    print("Building People API service...")
    service = build('people', 'v1', credentials=creds)
    print("People API service created successfully")
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
    return '\n'.join([
        f"{event.get('summary', 'No Title')} ({event['start'].get('dateTime', event['start'].get('date'))} - {event['end'].get('dateTime', event['end'].get('date'))}) - ID: {event['id']}"
        for event in events
    ])

def reorder_events_tool():
    """
    Google Calendar does not support reordering events directly, as events are sorted by start time.
    This is a placeholder.
    """
    return "Reordering events is not supported by Google Calendar API. Events are always sorted by start time."

def search_contacts_by_name_tool(name: str):
    """
    Search Google Contacts by name using the People API.
    Returns a list of matching contacts' names and emails.
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

def get_all_contacts_tool(page_size: int = 1000):
    """
    Get all contacts from Google Contacts using the People API.
    Returns a list of all contacts with their names and emails.
    
    Args:
        page_size (int): Number of contacts to fetch per page (default: 1000)
    """
    print("Starting to fetch all contacts...")
    try:
        service = get_user_people_service()
        all_contacts = []
        next_page_token = None
        
        while True:
            print(f"Fetching contacts page (page_size: {page_size})...")
            results = service.people().connections().list(
                resourceName='people/me',
                pageSize=page_size,
                pageToken=next_page_token,
                personFields='names,emailAddresses,phoneNumbers,organizations'
            ).execute()
            
            connections = results.get('connections', [])
            print(f"Found {len(connections)} contacts in this page")
            
            for person in connections:
                names = person.get('names', [])
                emails = person.get('emailAddresses', [])
                phones = person.get('phoneNumbers', [])
                orgs = person.get('organizations', [])
                
                if names:
                    display_name = names[0].get('displayName', '')
                    contact_info = [display_name]
                    
                    if emails:
                        contact_info.append(f"Email: {emails[0].get('value', '')}")
                    if phones:
                        contact_info.append(f"Phone: {phones[0].get('value', '')}")
                    if orgs:
                        contact_info.append(f"Organization: {orgs[0].get('name', '')}")
                    
                    all_contacts.append(" | ".join(contact_info))
            
            next_page_token = results.get('nextPageToken')
            if not next_page_token:
                print("No more pages to fetch")
                break
        
        if not all_contacts:
            print("No contacts found")
            return 'No contacts found.'
        
        print(f"Successfully fetched {len(all_contacts)} total contacts")
        return f"Found {len(all_contacts)} contacts:\n" + '\n'.join(all_contacts)
    except Exception as e:
        print(f"Error fetching contacts: {str(e)}")
        raise

def find_similar_contacts_tool(name: str, top_n: int = 2) -> Tuple[List[dict], bool]:
    """
    Search for similar names in contacts and return top matches.
    Returns a tuple of (list of matches, success flag).
    Each match is a dict with name, email, and similarity score.
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
        search_parts = name.lower().split()
        print(f"\nSearch name parts: {search_parts}")
        
        # Calculate similarity scores with improved matching
        print("\nCalculating similarity scores:")
        for contact in all_contacts:
            contact_name = contact['name'].lower()
            contact_parts = contact_name.split()
            
            # Calculate different types of similarity
            full_name_similarity = SequenceMatcher(None, name.lower(), contact_name).ratio()
            
            # Check if any part of the search name matches any part of the contact name
            part_matches = 0
            for search_part in search_parts:
                for contact_part in contact_parts:
                    if search_part in contact_part or contact_part in search_part:
                        part_matches += 1
                        break
            
            # Calculate part similarity
            part_similarity = part_matches / len(search_parts) if search_parts else 0
            
            # Use the maximum of full name similarity and part similarity
            contact['similarity'] = max(full_name_similarity, part_similarity)
            print(f"Contact: {contact['name']} - Similarity: {contact['similarity']:.2f}")
        
        # Sort by similarity and get top matches
        all_contacts.sort(key=lambda x: x['similarity'], reverse=True)
        top_matches = all_contacts[:top_n]
        
        # Lower the threshold for matching
        top_matches = [match for match in top_matches if match['similarity'] > 0.2]
        
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

