import { Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@chakra-ui/system";
import { StreamingText } from "./StreamingText";

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  isNew?: boolean;
}

export function ChatMessage({ content, isUser, isNew = false }: ChatMessageProps) {
  const bgColor = useColorModeValue(isUser ? "blue.500" : "gray.100", isUser ? "blue.500" : "gray.700");
  const textColor = useColorModeValue(isUser ? "white" : "gray.800", isUser ? "white" : "gray.100");

  return (
    <Flex justify={isUser ? "flex-end" : "flex-start"} mb={4} w="100%">
      <Box
        maxW="80%"
        bg={bgColor}
        color={textColor}
        p={3}
        borderRadius="lg"
        boxShadow="sm"
        _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
        transition="all 0.2s ease-in-out"
      >
        {isUser ? (
          <Text fontSize="md" lineHeight="tall">
            {content}
          </Text>
        ) : isNew ? (
          <StreamingText text={content} />
        ) : (
          <Text fontSize="md" lineHeight="tall">
            {content}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
