import { Box, VStack } from "@chakra-ui/react";
import { Divider } from "@chakra-ui/layout";
import { FiCheck, FiX, FiAlertCircle, FiCalendar } from "react-icons/fi";
import { motion } from "framer-motion";
import { useState } from "react";
import { SidebarTitle } from "../sidebar/SidebarTitle";
import { CalendarItem } from "../sidebar/CalendarItem";
import { AddCalendarButton } from "../sidebar/AddCalendarButton";
import { LinkCalendarModal } from "../sidebar/LinkCalendarModal";
import type { Calendar } from "../../types/calendar";

const MotionBox = motion(Box);

const mockCalendars: Calendar[] = [
  {
    id: "1",
    name: "Work Calendar",
    requests: [
      { id: "1", summary: "Request to add new team meeting", status: "done" },
      { id: "2", summary: "Schedule project review", status: "inProgress" },
    ],
  },
  {
    id: "2",
    name: "Personal Calendar",
    requests: [
      { id: "3", summary: "Dentist appointment", status: "canceled" },
      { id: "4", summary: "Gym session", status: "done" },
    ],
  },
];

interface LeftSidebarProps {
  isOpen: boolean;
}

export function LeftSidebar({ isOpen }: LeftSidebarProps) {
  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set());
  const [calendarName, setCalendarName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleLinkCalendar = (provider: "google" | "microsoft") => {
    // Handle calendar linking logic here
    console.log(`Linking calendar: ${calendarName} via ${provider}`);
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
        w={isOpen ? "252px" : "0"}
        initial={false}
        animate={{
          width: isOpen ? "252px" : "0",
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
        <VStack align="stretch" p={4} opacity={isOpen ? 1 : 0} transition="opacity 0.2s" gap="3vh">
          <SidebarTitle textColor={textColor} />

          <Divider borderColor={borderColor} />

          <VStack align="stretch" gap={2}>
            {mockCalendars.map((calendar, index) => (
              <Box key={calendar.id}>
                <CalendarItem
                  calendar={calendar}
                  isExpanded={expandedCalendars.has(calendar.id)}
                  onToggle={() => toggleCalendar(calendar.id)}
                  textColor={textColor}
                  hoverBg={hoverBg}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                />
                {index < mockCalendars.length - 1 && <Divider borderColor={borderColor} my={2} />}
              </Box>
            ))}
          </VStack>

          <Divider borderColor={borderColor} />

          <AddCalendarButton textColor={textColor} hoverBg={hoverBg} onClick={() => setIsModalOpen(true)} />
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
      />
    </>
  );
}
