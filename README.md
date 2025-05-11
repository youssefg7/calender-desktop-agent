# ChronoSync.AI - Calendar Management Agent 

## Overview

This project is an AI-powered calendar management agent that leverages LLMs to help users manage their Google Calendar events and contacts using natural language. The system provides a conversational interface for scheduling, editing, and querying events, as well as managing contacts and invitations, all with proactive conflict checking and user-friendly suggestions.

---

## Features

### Calendar Management
- **Create Events:** Add new events to any of your Google Calendars, with support for attendees, locations, descriptions, colors, and recurrence rules.
- **Edit Events:** Update event details, including time, title, attendees, and more.
- **Delete Events:** Remove events from your calendar with confirmation.
- **List Events:** Retrieve and display events from one or multiple calendars, with filtering by date, time, and search terms.
- **Conflict Checking:** Automatically checks for scheduling conflicts and suggests alternative free time slots before creating or editing events.
- **Multi-calendar Support:** Handles multiple Google Calendars per user.

### Contact Management
- **Find Contacts:** Search for similar contacts in your Google Contacts to help with event invitations.
- **Add/Edit Contacts:** Add new contacts or update existing ones directly from the agent interface.

### Invitations & Collaboration
- **Send Invitations:** Invite attendees to events and send email notifications.
- **Pending Invitations:** List and manage pending calendar invitations.

### Conversational AI
- **Natural Language Interface:** Interact with the agent using plain English to manage your calendar and contacts.
- **Context Awareness:** Remembers conversation context and confirms intent before making changes.
- **Validation:** Filters out invalid, inappropriate, or ambiguous requests.

---

## Tech Stack

### Backend
- **API:** FastAPI
- **LLM Integration:** OpenAI (via LangChain)
- **Google APIs:** Calendar & People (OAuth2)
- **Database:** PostgreSQL (for persistent data, if enabled)
- **Cache:** Redis (for session and state management)
- **Tracing & Monitoring:** Langfuse
- **Other:** SQLAlchemy, Pydantic, orjson

### Frontend
- **Framework:** React + TypeScript + Vite
- **UI:** Chakra UI
- **State Management:** React Context/Hooks
- **Styling:** CSS-in-JS (Chakra)
- **Icons:** React Icons

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google Cloud Project with OAuth2 credentials for Calendar and People APIs

### Backend

1. **Install dependencies:**
   ```bash
   cd src
   pip install -r ../requirements.txt
   ```

2. **Google API Credentials:**
   - Place your OAuth client JSON in `src/assets/OAuth Client ID mcp-test.json`.
   - The app will generate `token.pickle` and `token_people.pickle` on first run.

3. **Run the backend:**
   ```bash
   uvicorn main:app --reload
   ```

4. **Environment Variables:**
   - Configure any required environment variables (e.g., for database, Redis, Langfuse) in your preferred way.

### Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` by default.

---

## Usage

- Open the frontend in your browser.
- Log in with your Google account (OAuth flow will prompt on first use).
- Use the chat interface to:
  - Schedule, edit, or delete events (e.g., "Schedule a meeting with John tomorrow at 3pm").
  - Query your calendar (e.g., "What events do I have next week?").
  - Manage contacts and invitations.
- The agent will confirm actions, check for conflicts, and suggest alternatives as needed.

---

## Project Structure

```
.
├── src/                # Backend (FastAPI, core logic, Google API tools)
│   ├── core/main_graph # LLM agent, tools, prompts, graph logic
│   ├── routes/v1       # API endpoints
│   ├── database        # Redis, Langfuse, etc.
│   └── ...
├── frontend/           # React + Chakra UI frontend
│   ├── src/            # Main app, layouts, chat interface
│   └── ...
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

---

## License

MIT License

---

## Acknowledgements

- [FastAPI](https://fastapi.tiangolo.com/)
- [LangChain](https://www.langchain.com/)
- [Chakra UI](https://chakra-ui.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [OpenAI](https://openai.com/)
- [Langfuse](https://langfuse.com/)



