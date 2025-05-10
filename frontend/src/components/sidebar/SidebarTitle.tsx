import { Text } from "@chakra-ui/react";

interface SidebarTitleProps {
  textColor: string;
}

export function SidebarTitle({ textColor }: SidebarTitleProps) {
  return (
    <Text fontSize="lg" fontWeight="bold" color={textColor} userSelect="none">
      Calendars
    </Text>
  );
}
