import { Box, VStack, Button, Flex, Text, Icon } from "@chakra-ui/react";
import { Divider } from "@chakra-ui/layout";
import { FiCheck, FiX, FiAlertCircle, FiCalendar, FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { SidebarTitle } from "../sidebar/SidebarTitle";
import { CalendarItem } from "../sidebar/CalendarItem";
import { AddCalendarButton } from "../sidebar/AddCalendarButton";
import { LinkCalendarModal } from "../sidebar/LinkCalendarModal";
import type { Calendar, CalendarRequest } from "../../types/calendar";

const MotionBox = motion(Box);

export const mockCalendars: Calendar[] = [
  {
    id: "1",
    name: "Work Account",
    email: "work@example.com",
    requests: [
      { id: "1", summary: "Request to add new team meeting", status: "done" },
      { id: "2", summary: "Schedule project review", status: "inProgress" },
    ],
  },
  {
    id: "2",
    name: "Personal Account",
    email: "personal@gmail.com",
    requests: [
      { id: "3", summary: "Dentist appointment", status: "canceled" },
      { id: "4", summary: "Gym session", status: "done" },
    ],
  },
];

// Create a copy that we can modify as user interacts
let calendarsData = [...mockCalendars];

// Create a function to add a new request to a calendar
export const addRequestToCalendar = (calendarId: string, requestId: string, summary: string = "New request") => {
  const newRequest: CalendarRequest = {
    id: requestId,
    summary,
    status: "inProgress",
  };

  // Find the calendar and add the request
  const calendarIndex = calendarsData.findIndex((cal) => cal.id === calendarId);
  if (calendarIndex >= 0) {
    // Create a new array to ensure reactivity
    calendarsData = [...calendarsData];
    calendarsData[calendarIndex] = {
      ...calendarsData[calendarIndex],
      requests: [...calendarsData[calendarIndex].requests, newRequest],
    };
  }

  return calendarsData;
};

interface LeftSidebarProps {
  isOpen: boolean;
  onRequestSelect: (requestId: string | null) => void;
  activeRequestId: string | null;
  isCalendarModalOpen?: boolean;
  setIsCalendarModalOpen?: Dispatch<SetStateAction<boolean>>;
  onTitleClick?: () => void;
}

export function LeftSidebar({
  isOpen,
  onRequestSelect,
  activeRequestId,
  isCalendarModalOpen = false,
  setIsCalendarModalOpen = () => {},
  onTitleClick = () => {},
}: LeftSidebarProps) {
  // Initialize with the first calendar expanded
  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set(mockCalendars.length > 0 ? [mockCalendars[0].id] : []));
  const [calendarName, setCalendarName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendars, setCalendars] = useState(calendarsData);

  // Update our state when the calendarsData changes
  useEffect(() => {
    setCalendars(calendarsData);
  }, [calendarsData]);

  // Auto-expand a calendar when its request is selected
  useEffect(() => {
    if (activeRequestId) {
      // Find which calendar contains this request
      for (const calendar of calendars) {
        const hasRequest = calendar.requests.some((req) => req.id === activeRequestId);
        if (hasRequest) {
          setExpandedCalendars((prev) => {
            const next = new Set(prev);
            next.add(calendar.id);
            return next;
          });
        }
      }
    }
  }, [activeRequestId, calendars]);

  // Sync local modal state with parent component's state
  useEffect(() => {
    setIsModalOpen(isCalendarModalOpen);
  }, [isCalendarModalOpen]);

  // When local modal state changes, update parent component's state
  useEffect(() => {
    setIsCalendarModalOpen(isModalOpen);
  }, [isModalOpen, setIsCalendarModalOpen]);

  const bgColor = "gray.800";
  const borderColor = "gray.700";
  const textColor = "gray.300";
  const hoverBg = "gray.700";

  const toggleCalendar = (calendarId: string) => {
    setExpandedCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(calendarId)) {
        next.delete(calendarId);
      } else {
        next.add(calendarId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "green.500";
      case "canceled":
        return "red.500";
      case "inProgress":
        return "yellow.500";
      default:
        return "gray.500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return FiCheck;
      case "canceled":
        return FiX;
      case "inProgress":
        return FiAlertCircle;
      default:
        return FiCalendar;
    }
  };

  const handleLinkCalendar = () => {
    // Handle Google Calendar linking
    console.log(`Linking calendar: ${calendarName} via Google`);
    setIsModalOpen(false);
    setCalendarName("");
  };

  return (
    <>
      <MotionBox
        position="fixed"
        left={0}
        top={0}
        h="100vh"
        bg={bgColor}
        borderRight="1px"
        borderColor={borderColor}
        w={isOpen ? "315px" : "0"}
        initial={false}
        animate={{
          width: isOpen ? "315px" : "0",
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        overflow="hidden"
        zIndex={20}
      >
        <VStack align="stretch" p={3} opacity={isOpen ? 1 : 0} transition="opacity 0.2s" gap="2vh">
          <SidebarTitle textColor={textColor} />

          <AddCalendarButton textColor={textColor} hoverBg={hoverBg} onClick={() => setIsModalOpen(true)} />

          <Button size="xs" onClick={onTitleClick} colorScheme="blue" fontSize="xs" height="auto" py={2}>
            <Flex align="center" gap={1}>
              <Icon as={FiPlus} boxSize="0.9em" />
              <Text>Initiate a new Calendar Request</Text>
            </Flex>
          </Button>

          <Divider borderColor={borderColor} />

          <VStack align="stretch" gap={2}>
            {calendars.map((calendar, index) => (
              <Box key={calendar.id}>
                <CalendarItem
                  calendar={calendar}
                  isExpanded={expandedCalendars.has(calendar.id)}
                  onToggle={() => toggleCalendar(calendar.id)}
                  textColor={textColor}
                  hoverBg={hoverBg}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  onRequestSelect={onRequestSelect}
                  activeRequestId={activeRequestId}
                />
                {index < calendars.length - 1 && <Divider borderColor={borderColor} my={2} />}
              </Box>
            ))}
          </VStack>
        </VStack>
      </MotionBox>

      <LinkCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        calendarName={calendarName}
        onCalendarNameChange={setCalendarName}
        onLinkCalendar={handleLinkCalendar}
        bgColor={bgColor}
        textColor={textColor}
        borderColor={borderColor}
      />
    </>
  );
}
