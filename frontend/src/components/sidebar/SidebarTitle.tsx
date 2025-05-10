import { Flex, Icon, Heading, Text } from "@chakra-ui/react";
import { FiCalendar } from "react-icons/fi";

interface SidebarTitleProps {
  textColor: string;
}

export function SidebarTitle({ textColor }: SidebarTitleProps) {
  return (
    <Flex direction="column" mb={3}>
      <Flex align="center" gap={2}>
        <Icon as={FiCalendar} boxSize="1.2em" color="blue.400" />
        <Heading size="sm" fontWeight="bold" color="blue.400" userSelect="none">
          ChronoSync.AI
        </Heading>
      </Flex>
      <Text fontSize="xs" color={textColor} ml={7} mt={1} opacity={0.8}>
        Your Calendar Assistant
      </Text>
    </Flex>
  );
}
