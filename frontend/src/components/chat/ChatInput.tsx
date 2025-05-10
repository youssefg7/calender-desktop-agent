import { Box, Input, IconButton } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import { useState } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSend, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} display="flex" gap={2}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        size="md"
        bg="gray.800"
        borderColor="gray.600"
        _hover={{ borderColor: "gray.500" }}
        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
        color="white"
        _placeholder={{ color: "gray.400" }}
        disabled={isLoading}
      />
      <IconButton aria-label="Send message" colorScheme="blue" size="md" type="submit" disabled={!message.trim() || isLoading}>
        <FiSend size="1em" />
      </IconButton>
    </Box>
  );
}
