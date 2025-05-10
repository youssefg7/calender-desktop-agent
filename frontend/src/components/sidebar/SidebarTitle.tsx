import { Flex, Icon, Heading } from "@chakra-ui/react";
import { FiCalendar } from "react-icons/fi";

interface SidebarTitleProps {
  textColor: string;
}

export function SidebarTitle({ textColor }: SidebarTitleProps) {
  return (
    <Flex align="center" mb={1} gap={2}>
      <Icon as={FiCalendar} boxSize="1.2em" color="blue.400" />
      <Heading size="sm" fontWeight="bold" color={textColor} userSelect="none">
        Calendar Accounts
      </Heading>
    </Flex>
  );
}
