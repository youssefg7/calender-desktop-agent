import { Box, Flex, Text, Spinner, Heading, IconButton } from "@chakra-ui/react";
import { Divider } from "@chakra-ui/layout";
import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { addRequestToCalendar } from "../layout/LeftSidebar";

interface Message {
  content: string;
  isUser: boolean;
  isNew?: boolean;
  thinkingProcess?: string | null;
  isThinkingExpanded?: boolean;
}

interface ChatSession {
  threadId: string | null;
  messages: Message[];
}

interface ChatInterfaceProps {
  activeRequestId: string | null;
  selectedCalendarId: string | null;
  onAddNewRequest?: (requestId: string, calendarId: string) => void;
}

export function ChatInterface({ activeRequestId, selectedCalendarId, onAddNewRequest = () => {} }: ChatInterfaceProps) {
  // Store all chat sessions in memory
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newRequestId, setNewRequestId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Initialize new session when activeRequestId changes
  useEffect(() => {
    if (activeRequestId && !chatSessions[activeRequestId]) {
      setChatSessions((prev) => ({
        ...prev,
        [activeRequestId]: {
          threadId: null,
          messages: [],
        },
      }));
    }
    // Mark all messages as not new when switching requests
    if (activeRequestId && chatSessions[activeRequestId]) {
      setChatSessions((prev) => ({
        ...prev,
        [activeRequestId]: {
          ...prev[activeRequestId],
          messages: prev[activeRequestId].messages.map((msg) => ({ ...msg, isNew: false })),
        },
      }));
    }
    // Reset first load flag when changing requests
    isFirstLoad.current = true;

    // After a short delay, set isFirstLoad to false
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [activeRequestId]);

  // Clear newRequestId when activeRequestId changes
  useEffect(() => {
    if (activeRequestId) {
      setNewRequestId(null);
    }
  }, [activeRequestId]);

  // Get current session or create new one
  const currentRequestId = activeRequestId || newRequestId;
  const currentSession = currentRequestId ? chatSessions[currentRequestId] : null;

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // Scroll to bottom when content changes
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const shouldScroll = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      if (shouldScroll) {
        scrollToBottom();
      }
    }
    // Set isFirstLoad to false after the initial render
    isFirstLoad.current = false;
  }, [currentSession?.messages]);

  const parseMessage = (message: string): string => {
    try {
      const cleanMessage = message
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
      const jsonData = JSON.parse(cleanMessage);
      return jsonData.response || message;
    } catch {
      return message;
    }
  };

  const updateSession = (requestId: string, updates: Partial<ChatSession>) => {
    setChatSessions((prev) => {
      const currentSession = prev[requestId] || { threadId: null, messages: [] };
      return {
        ...prev,
        [requestId]: {
          ...currentSession,
          ...updates,
          messages: updates.messages || currentSession.messages,
        },
      };
    });
  };

  const handleSendMessage = async (content: string) => {
    // If no active request and no calendar selected, show error
    if (!selectedCalendarId && !activeRequestId) {
      alert("Please select a calendar first.");
      return;
    }

    // If no active request, create a new one for the selected calendar
    if (!activeRequestId && !newRequestId) {
      // Generate a temporary ID for the new request
      const tempId = `new-request-${Date.now()}`;
      setNewRequestId(tempId);

      // Initialize a new session for this request
      setChatSessions((prev) => ({
        ...prev,
        [tempId]: {
          threadId: null,
          messages: [],
        },
      }));

      // Add the request to the calendar in the sidebar
      if (selectedCalendarId) {
        // The first message will be the summary for the request
        addRequestToCalendar(selectedCalendarId, tempId, content);

        // Notify parent component about the new request
        onAddNewRequest(tempId, selectedCalendarId);
      }

      // Use this new ID for the current message
      const requestId = tempId;
      await sendMessage(content, requestId);
    } else {
      // Use existing request ID
      const requestId = activeRequestId || (newRequestId as string);
      await sendMessage(content, requestId);
    }
  };

  const sendMessage = async (content: string, requestId: string) => {
    setIsLoading(true);

    const newMessage = {
      content,
      isUser: true,
      isNew: true,
    };

    // Update messages in current session
    setChatSessions((prev) => {
      const currentSession = prev[requestId] || { threadId: null, messages: [] };
      return {
        ...prev,
        [requestId]: {
          ...currentSession,
          messages: [...currentSession.messages, newMessage],
          thinkingProcess: null, // Reset thinking process for new message
          isThinkingExpanded: true, // Always expand thinking process when sending a new message
        },
      };
    });

    try {
      if (!currentSession?.threadId) {
        // Start new chat
        const response = await fetch(`http://localhost:8000/api/v1/chat/start-chat?user_message=${encodeURIComponent(content)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to start chat");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        // Read the stream to get the thread ID
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.op === "trace_id") {
                updateSession(requestId, { threadId: data.trace_id });
              } else if (data.op === "info") {
                // Keep track of thinking process in the session
                const parsedMessage = parseMessage(data.message);

                // Update the last user message with thinking process
                setChatSessions((prev) => {
                  const currentSession = prev[requestId] || { threadId: null, messages: [] };
                  const messages = [...currentSession.messages];

                  // Find the last user message
                  for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].isUser) {
                      // Update this message with the thinking process
                      messages[i] = {
                        ...messages[i],
                        thinkingProcess: parsedMessage,
                        isThinkingExpanded: true, // Start expanded
                      };
                      break;
                    }
                  }

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages,
                    },
                  };
                });
              } else if (data.op === "final_generated") {
                // When final message is received, add final message
                setChatSessions((prev) => {
                  const currentSession = prev[requestId] || { threadId: null, messages: [] };

                  // Create a copy of messages and collapse any expanded thinking processes
                  const collapsedMessages = currentSession.messages.map((msg) => ({
                    ...msg,
                    isThinkingExpanded: false,
                  }));

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages: [
                        ...collapsedMessages,
                        {
                          content: parseMessage(data.message),
                          isUser: false,
                          isNew: true,
                        },
                      ],
                    },
                  };
                });
              }
            }
          }
        }
      } else {
        // Continue existing chat
        const response = await fetch(`http://localhost:8000/api/v1/chat/?user_message=${encodeURIComponent(content)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "thread-id": currentSession.threadId,
          },
        });

        if (!response.ok) throw new Error("Failed to send message");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (data.op === "info") {
                // Keep track of thinking process in the session
                const parsedMessage = parseMessage(data.message);

                // Update the last user message with thinking process
                setChatSessions((prev) => {
                  const currentSession = prev[requestId] || { threadId: null, messages: [] };
                  const messages = [...currentSession.messages];

                  // Find the last user message
                  for (let i = messages.length - 1; i >= 0; i--) {
                    if (messages[i].isUser) {
                      // Update this message with the thinking process
                      messages[i] = {
                        ...messages[i],
                        thinkingProcess: parsedMessage,
                        isThinkingExpanded: true, // Start expanded
                      };
                      break;
                    }
                  }

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages,
                    },
                  };
                });
              } else if (data.op === "final_generated") {
                // When final message is received, add final message
                setChatSessions((prev) => {
                  const currentSession = prev[requestId] || { threadId: null, messages: [] };

                  // Create a copy of messages and collapse any expanded thinking processes
                  const collapsedMessages = currentSession.messages.map((msg) => ({
                    ...msg,
                    isThinkingExpanded: false,
                  }));

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages: [
                        ...collapsedMessages,
                        {
                          content: parseMessage(data.message),
                          isUser: false,
                          isNew: true,
                        },
                      ],
                    },
                  };
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setChatSessions((prev) => {
        const currentSession = prev[requestId] || { threadId: null, messages: [] };
        return {
          ...prev,
          [requestId]: {
            ...currentSession,
            messages: [
              ...currentSession.messages,
              {
                content: "Sorry, there was an error processing your message.",
                isUser: false,
                isNew: true,
              },
            ],
          },
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display a message if no calendar is selected
  if (!selectedCalendarId && !activeRequestId) {
    return (
      <Flex direction="column" h="100%" w="100%" bg="gray.900" position="relative" align="center" justify="center">
        <Box color="gray.400" fontSize="lg">
          Select a calendar to start chatting
        </Box>
      </Flex>
    );
  }

  // Render messages with interleaved thinking processes
  const renderMessages = () => {
    if (!currentSession || !currentSession.messages || currentSession.messages.length === 0) {
      return null;
    }

    const result = [];

    for (let i = 0; i < currentSession.messages.length; i++) {
      const message = currentSession.messages[i];

      // Add the user message
      result.push(
        <ChatMessage key={`msg-${i}`} content={message.content} isUser={message.isUser} isNew={!isFirstLoad.current && message.isNew} />
      );

      // If this is a user message and there's a next message that's not a user (i.e., agent response)
      // and there's a thinking process, show the thinking process before the agent's response
      if (message.isUser && message.thinkingProcess) {
        const showThinking = message.isThinkingExpanded ?? false;

        result.push(
          <Flex key={`thinking-${i}`} justify="flex-start" mb={1} w="100%">
            <Box
              maxW="75%"
              bg="gray.800"
              color="gray.100"
              p={2}
              pl={3}
              borderRadius="md"
              boxShadow="sm"
              border="1px solid"
              borderColor="gray.700"
              fontSize="xs"
              ml={4}
              mt={-1}
            >
              <Flex justify="space-between" align="center">
                <Flex align="center">
                  {isLoading && i === currentSession.messages.length - 1 && <Spinner size="xs" color="blue.400" mr={2} />}
                  <Heading size="xs" color="blue.300" fontSize="xs">
                    Agent Thought Process
                  </Heading>
                </Flex>
                <IconButton
                  aria-label={showThinking ? "Collapse thinking" : "Expand thinking"}
                  size="2xs"
                  minW="16px"
                  height="16px"
                  p="0"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  color="white"
                  onClick={() => {
                    setChatSessions((prev) => {
                      const currentSession = prev[currentRequestId!];
                      if (!currentSession) return prev;

                      const messages = [...currentSession.messages];
                      messages[i] = {
                        ...messages[i],
                        isThinkingExpanded: !showThinking,
                      };

                      return {
                        ...prev,
                        [currentRequestId!]: {
                          ...currentSession,
                          messages,
                        },
                      };
                    });
                  }}
                >
                  {showThinking ? <FiChevronUp size="0.6em" /> : <FiChevronDown size="0.6em" />}
                </IconButton>
              </Flex>

              {showThinking && (
                <>
                  <Divider borderColor="gray.700" my={1} />
                  <Text fontSize="xs" lineHeight="1.4">
                    {message.thinkingProcess}
                  </Text>
                </>
              )}
            </Box>
          </Flex>
        );
      }
    }

    return result;
  };

  // If a calendar is selected but no active request, show the chat interface
  return (
    <Flex direction="column" h="100%" w="100%" bg="gray.900" position="relative">
      <Box
        ref={chatContainerRef}
        flex="1"
        overflowY="auto"
        w="100%"
        px={4}
        pb="120px"
        userSelect="text"
        css={{
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            width: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "gray.600",
            borderRadius: "24px",
          },
        }}
      >
        <Flex direction="column" gap={4} maxW="720px" mx="auto">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </Flex>
      </Box>

      <Box position="fixed" bottom={0} left={0} right={0} p={3} bg="gray.900" borderTop="1px" borderColor="gray.700" zIndex={10}>
        <Box maxW="720px" mx="auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </Box>
      </Box>
    </Flex>
  );
}
