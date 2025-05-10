import { Box, Button, Flex, Input } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box bg="gray.800" borderRadius="xl" p={2} boxShadow="lg">
        <Flex gap={2}>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            size="lg"
            bg="gray.700"
            border="none"
            color="white"
            _placeholder={{ color: "gray.400" }}
            _focus={{ boxShadow: "none" }}
            flex="1"
            h="56px"
          />
          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            px={6}
            h="56px"
            disabled={!message.trim()}
            _hover={{ bg: "blue.500" }}
            _active={{ bg: "blue.600" }}
          >
            <FiSend />
          </Button>
        </Flex>
      </Box>
    </form>
  );
}
