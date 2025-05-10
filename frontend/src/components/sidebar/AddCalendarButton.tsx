import { Button, Text, Icon } from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";

interface AddCalendarButtonProps {
  textColor: string;
  hoverBg: string;
  onClick: () => void;
}

export function AddCalendarButton({ textColor, hoverBg, onClick }: AddCalendarButtonProps) {
  return (
    <Button
      size="sm"
      variant="ghost"
      color={textColor}
      _hover={{ bg: hoverBg }}
      justifyContent="flex-start"
      onClick={onClick}
      transition="all 0.2s"
    >
      <Icon as={FiPlus} mr={2} />
      <Text userSelect="none">Link New Calendar</Text>
    </Button>
  );
}
