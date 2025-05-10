import { Box, Flex, Text, VStack, Icon } from "@chakra-ui/react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";
import type { Calendar } from "../../types/calendar";

interface CalendarItemProps {
  calendar: Calendar;
  isExpanded: boolean;
  onToggle: () => void;
  textColor: string;
  hoverBg: string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ElementType;
}

export function CalendarItem({ calendar, isExpanded, onToggle, textColor, hoverBg, getStatusColor, getStatusIcon }: CalendarItemProps) {
  return (
    <Box>
      <Flex align="center" cursor="pointer" onClick={onToggle} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
        <Icon as={FiCalendar} mr={2} color={textColor} />
        <Text fontWeight="medium" color={textColor} flex="1" userSelect="none">
          {calendar.name}
        </Text>
        <Icon as={FiChevronDown} color={textColor} transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"} transition="transform 0.2s" />
      </Flex>
      {isExpanded && (
        <VStack align="stretch" pl={6} mt={2} gap={2}>
          {calendar.requests.map((request) => (
            <Box
              key={request.id}
              p={2}
              borderRadius="md"
              borderLeft="3px solid"
              borderColor={getStatusColor(request.status)}
              bg={`${getStatusColor(request.status)}10`}
              _hover={{ bg: hoverBg }}
              transition="all 0.2s"
            >
              <Flex align="center" justify="space-between">
                <Text fontSize="sm" color={textColor} truncate userSelect="none">
                  {request.summary}
                </Text>
                <Icon as={getStatusIcon(request.status)} color={getStatusColor(request.status)} />
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
