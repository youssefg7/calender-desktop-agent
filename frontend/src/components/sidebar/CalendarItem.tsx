import { Box, Flex, Text, VStack, Icon } from "@chakra-ui/react";
import { FiCalendar, FiChevronDown, FiClock, FiFolder } from "react-icons/fi";
import type { Calendar } from "../../types/calendar";

interface CalendarItemProps {
  calendar: Calendar;
  isExpanded: boolean;
  onToggle: () => void;
  textColor: string;
  hoverBg: string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ElementType;
  onRequestSelect: (requestId: string) => void;
  activeRequestId: string | null;
}

export function CalendarItem({
  calendar,
  isExpanded,
  onToggle,
  textColor,
  hoverBg,
  getStatusColor,
  getStatusIcon,
  onRequestSelect,
  activeRequestId,
}: CalendarItemProps) {
  return (
    <Box>
      <Flex
        align="center"
        cursor="pointer"
        onClick={onToggle}
        p={2}
        borderRadius="md"
        transition="all 0.2s"
        borderWidth="1px"
        borderColor="transparent"
        _hover={{ borderColor: "gray.600", bg: hoverBg }}
      >
        <Box bg="teal.500" p={1} borderRadius="md" mr={2} display="flex" alignItems="center" justifyContent="center">
          <Icon as={FiCalendar} color="white" boxSize="0.9em" />
        </Box>
        <Text fontSize="sm" fontWeight="medium" color={textColor} flex="1" userSelect="none">
          {calendar.name}
        </Text>
        <Icon
          as={FiChevronDown}
          color={textColor}
          boxSize="0.9em"
          transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        />
      </Flex>
      {isExpanded && (
        <VStack align="stretch" pl={7} mt={1} mb={1} gap={1}>
          {calendar.requests.map((request) => (
            <Box
              key={request.id}
              p={2}
              borderRadius="md"
              borderLeft="2px solid"
              borderColor={getStatusColor(request.status)}
              bg={activeRequestId === request.id ? hoverBg : `${getStatusColor(request.status)}10`}
              _hover={{ bg: hoverBg, transform: "translateX(2px)" }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => onRequestSelect(request.id)}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center">
                  <Icon
                    as={request.status === "inProgress" ? FiClock : getStatusIcon(request.status)}
                    color={getStatusColor(request.status)}
                    boxSize="0.8em"
                    mr={1}
                  />
                  <Text fontSize="xs" color={textColor} fontWeight="medium" userSelect="none">
                    {request.summary}
                  </Text>
                </Flex>
                <Icon as={FiFolder} color={getStatusColor(request.status)} boxSize="0.8em" opacity={0.7} _hover={{ opacity: 1 }} />
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
