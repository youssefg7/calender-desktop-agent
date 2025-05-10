import { Flex } from "@chakra-ui/react";
import { Navbar } from "./Navbar";
import { ChatInterface } from "../chat/ChatInterface";
import { LeftSidebar } from "./LeftSidebar";
import { useSidebar } from "../../hooks/useSidebar";
import { useState, useEffect } from "react";

// Import mock calendars for now
import { mockCalendars } from "./LeftSidebar";

export function MainLayout() {
  const { isLeftOpen, toggleLeft } = useSidebar();
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(mockCalendars.length > 0 ? mockCalendars[0].id : null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Define navbar height for consistent spacing
  const navbarHeight = "50px";

  // Function to find which calendar a request belongs to
  const findCalendarForRequest = (requestId: string) => {
    for (const calendar of mockCalendars) {
      const request = calendar.requests.find((req) => req.id === requestId);
      if (request) {
        return calendar.id;
      }
    }
    return null;
  };

  // Sync the selected calendar when a request is selected
  useEffect(() => {
    if (activeRequestId) {
      const calendarId = findCalendarForRequest(activeRequestId);
      if (calendarId) {
        setSelectedCalendarId(calendarId);
      }
    }
  }, [activeRequestId]);

  const handleSelectCalendar = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    // Clear the active request when switching calendars
    setActiveRequestId(null);
  };

  const handleRequestSelect = (requestId: string | null) => {
    setActiveRequestId(requestId);
  };

  const handleTitleClick = () => {
    // Go back to home page (clear selections)
    setActiveRequestId(null);
    // Reset to the first calendar instead of null
    setSelectedCalendarId(mockCalendars.length > 0 ? mockCalendars[0].id : null);
  };

  const handleAddNewRequest = (requestId: string, calendarId: string) => {
    // When a new request is added, update both the calendar and request selection
    setSelectedCalendarId(calendarId);
    setActiveRequestId(requestId);
  };

  return (
    <Flex direction="column" h="100vh" w="100vw" bg="gray.900" overflow="hidden">
      {/* Fixed navbar */}
      <Flex position="fixed" top="0" left="0" right="0" height={navbarHeight} zIndex={30}>
        <Navbar
          isSidebarOpen={isLeftOpen}
          onToggleSidebar={toggleLeft}
          calendars={mockCalendars}
          selectedCalendarId={selectedCalendarId}
          onSelectCalendar={handleSelectCalendar}
          onTitleClick={handleTitleClick}
        />
      </Flex>

      {/* Main content area with top padding to accommodate fixed navbar */}
      <Flex flex="1" minW="0" position="relative" mt={navbarHeight}>
        <LeftSidebar
          isOpen={isLeftOpen}
          onRequestSelect={handleRequestSelect}
          activeRequestId={activeRequestId}
          isCalendarModalOpen={isCalendarModalOpen}
          setIsCalendarModalOpen={setIsCalendarModalOpen}
          onTitleClick={handleTitleClick}
        />
        <Flex
          direction="column"
          flex="1"
          minW="0"
          position="absolute"
          left={isLeftOpen ? "315px" : "0"}
          right="0"
          top="2vh"
          bottom="0"
          transition="left 0.3s"
          overflowX="hidden"
          userSelect="none"
          maxW={{
            base: "100%",
            md: isLeftOpen ? "calc(100% - 315px)" : "100%",
          }}
        >
          <ChatInterface activeRequestId={activeRequestId} selectedCalendarId={selectedCalendarId} onAddNewRequest={handleAddNewRequest} />
        </Flex>
      </Flex>
    </Flex>
  );
}
