import { Box, Flex } from "@chakra-ui/react";
import { useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

const mockMessages = [
  {
    content: "Hello! How can I help you today?",
    isUser: false,
  },
  {
    content: "I need to schedule a meeting for tomorrow",
    isUser: true,
  },
  {
    content: "I'll help you with that. What time works best for you?",
    isUser: false,
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      content,
      isUser: true,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <Flex direction="column" h="100%" w="100%" bg="gray.900" position="relative" mt="2vh">
      <Box flex="1" overflowY="auto" w="100%" px={4} pb="120px">
        <Flex direction="column" gap={4} maxW="720px" mx="auto">
          {messages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
        </Flex>
      </Box>

      <Box position="absolute" bottom={0} left={0} right={0} p={4} bg="gray.900" borderTop="1px" borderColor="gray.700">
        <Box maxW="720px" mx="auto">
          <ChatInput onSend={handleSendMessage} />
        </Box>
      </Box>
    </Flex>
  );
}
