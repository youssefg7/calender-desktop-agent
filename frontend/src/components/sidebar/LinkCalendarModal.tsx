import { Box, Flex, Text, VStack, Icon, Button, Input, HStack, IconButton } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";

interface LinkCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarName: string;
  onCalendarNameChange: (name: string) => void;
  onLinkCalendar: (provider: "google" | "microsoft") => void;
  bgColor: string;
  textColor: string;
}

export function LinkCalendarModal({
  isOpen,
  onClose,
  calendarName,
  onCalendarNameChange,
  onLinkCalendar,
  bgColor,
  textColor,
}: LinkCalendarModalProps) {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="64px"
      left="252px"
      right="0"
      bottom="0"
      bg="blackAlpha.700"
      backdropFilter="blur(8px)"
      zIndex={20}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg={bgColor}
        borderRadius="xl"
        p={6}
        w="400px"
        onClick={(e) => e.stopPropagation()}
        boxShadow="2xl"
        border="1px"
        borderColor="gray.700"
        zIndex={21}
      >
        <Flex justify="space-between" align="center" mb={6}>
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Link New Calendar
          </Text>
          <IconButton
            aria-label="Close modal"
            variant="ghost"
            color="red.400"
            _hover={{ bg: "red.900", color: "red.200" }}
            size="sm"
            onClick={onClose}
          >
            <FiX />
          </IconButton>
        </Flex>

        <VStack gap={6}>
          <Box w="100%" position="relative">
            <Text mb={2} color={textColor} fontWeight="medium">
              Calendar Name
            </Text>
            <Input
              placeholder="Enter calendar name"
              value={calendarName}
              onChange={(e) => onCalendarNameChange(e.target.value)}
              size="lg"
              variant="outline"
              bg="gray.800"
              borderColor="gray.600"
              _hover={{ borderColor: "gray.500", bg: "gray.700" }}
              _focus={{ borderColor: "blue.400", bg: "gray.700", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
              color="white"
              _placeholder={{ color: "gray.400" }}
              px={4}
              fontSize="md"
              h="50px"
              lineHeight="50px"
            />
          </Box>

          <HStack gap={4} w="100%">
            <Button
              colorScheme="red"
              variant="solid"
              flex="1"
              onClick={() => onLinkCalendar("google")}
              disabled={!calendarName.trim()}
              h="48px"
              _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
              transition="all 0.2s"
            >
              <Flex align="center" gap={2}>
                <Icon as={FaGoogle} boxSize={5} />
                <Text>Google Calendar</Text>
              </Flex>
            </Button>
            <Button
              colorScheme="blue"
              variant="solid"
              flex="1"
              onClick={() => onLinkCalendar("microsoft")}
              disabled={!calendarName.trim()}
              h="48px"
              _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
              transition="all 0.2s"
            >
              <Flex align="center" gap={2}>
                <Icon as={FaMicrosoft} boxSize={5} />
                <Text>Outlook Calendar</Text>
              </Flex>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
