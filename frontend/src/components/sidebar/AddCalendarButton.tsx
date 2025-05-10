import { Button, Text, Flex, Icon, Box } from "@chakra-ui/react";
import { FiPlus, FiCalendar } from "react-icons/fi";

interface AddCalendarButtonProps {
  textColor: string;
  hoverBg: string;
  onClick: () => void;
}

export function AddCalendarButton({ textColor, hoverBg, onClick }: AddCalendarButtonProps) {
  return (
    <Button
      variant="outline"
      w="100%"
      justifyContent="flex-start"
      p={2}
      onClick={onClick}
      _hover={{ bg: hoverBg, borderColor: "blue.400" }}
      borderColor="gray.600"
      borderWidth="1px"
      borderRadius="md"
      size="sm"
      mb={1}
      transition="all 0.2s"
    >
      <Flex align="center" width="100%" justifyContent="space-between">
        <Flex align="center">
          <Box bg="blue.500" p={1} borderRadius="md" mr={2} display="flex" alignItems="center" justifyContent="center">
            <FiCalendar color="white" size="0.9em" />
          </Box>
          <Text color={textColor} fontWeight="medium" fontSize="sm">
            Link New Calendar Account
          </Text>
        </Flex>
        <Icon as={FiPlus} color="blue.400" boxSize="0.9em" />
      </Flex>
    </Button>
  );
}
