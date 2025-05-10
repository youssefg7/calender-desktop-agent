import { Box, Flex, Text, VStack, Icon, Button, Input, IconButton, Heading } from "@chakra-ui/react";
import { FiX, FiLink, FiCalendar } from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";

interface LinkCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarName: string;
  onCalendarNameChange: (value: string) => void;
  onLinkCalendar: () => void;
  bgColor: string;
  textColor: string;
  borderColor?: string;
}

export function LinkCalendarModal({
  isOpen,
  onClose,
  calendarName,
  onCalendarNameChange,
  onLinkCalendar,
  bgColor,
  textColor,
  borderColor = "gray.600",
}: LinkCalendarModalProps) {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="50px"
      left="315px"
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
        borderRadius="lg"
        p={4}
        w="380px"
        onClick={(e) => e.stopPropagation()}
        boxShadow="xl"
        border="1px"
        borderColor="gray.700"
        zIndex={21}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Flex align="center" gap={2}>
            <Icon as={FiCalendar} color="blue.400" boxSize="1.2em" />
            <Heading size="sm" color={textColor}>
              Link New Calendar Account
            </Heading>
          </Flex>
          <IconButton
            aria-label="Close modal"
            variant="ghost"
            color="red.400"
            _hover={{ bg: "red.900", color: "red.200" }}
            size="xs"
            onClick={onClose}
          >
            <FiX size="0.9em" />
          </IconButton>
        </Flex>

        <VStack gap={4}>
          <Box mb={2} w="100%">
            <Flex align="center" mb={1}>
              <Icon as={FiLink} mr={1} color="blue.400" boxSize="0.9em" />
              <Text fontWeight="medium" fontSize="xs" color={textColor}>
                Account Name
              </Text>
            </Flex>
            <Input
              value={calendarName}
              onChange={(e) => onCalendarNameChange(e.target.value)}
              placeholder="Enter account name"
              variant="outline"
              color={textColor}
              borderColor={borderColor}
              _focus={{ borderColor: "blue.400" }}
              size="sm"
            />
          </Box>

          <Box w="100%">
            <Button
              colorScheme="red"
              variant="solid"
              w="100%"
              onClick={onLinkCalendar}
              disabled={!calendarName.trim()}
              size="sm"
              _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
              transition="all 0.2s"
            >
              <Flex align="center" gap={2}>
                <Icon as={FaGoogle} boxSize="0.9em" />
                <Text fontSize="xs">Google Calendar</Text>
              </Flex>
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
