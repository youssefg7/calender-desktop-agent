import { Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/system";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export function ChatMessage({ content, isUser, timestamp }: ChatMessageProps) {
  const bgColor = useColorModeValue(isUser ? "blue.500" : "gray.100", isUser ? "blue.500" : "gray.700");
  const textColor = useColorModeValue(isUser ? "white" : "gray.800", isUser ? "white" : "gray.100");
  const timestampColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex justify={isUser ? "flex-end" : "flex-start"} mb={4} w="100%">
      <Box
        maxW="70%"
        bg={bgColor}
        color={textColor}
        p={4}
        borderRadius="xl"
        boxShadow="md"
        _hover={{ transform: "translateY(-1px)", boxShadow: "lg" }}
        transition="all 0.2s ease-in-out"
      >
        <Text fontSize="md" lineHeight="tall">
          {content}
        </Text>
        {timestamp && (
          <Text fontSize="xs" color={timestampColor} mt={2} textAlign={isUser ? "right" : "left"}>
            {timestamp}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
