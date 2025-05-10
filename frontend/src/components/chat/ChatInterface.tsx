import { Box, Flex, Text, Spinner, Heading, IconButton, Icon } from "@chakra-ui/react";
import { Divider } from "@chakra-ui/layout";
import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiChevronUp, FiCalendar, FiPlus, FiEdit, FiTrash2, FiCheck } from "react-icons/fi";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { addRequestToCalendar } from "../layout/LeftSidebar";
import { motion, AnimatePresence } from "framer-motion";

interface EventMetadata {
  title: string;
  start: string;
  end: string;
  attendees: string[];
  event_id?: string;
}

interface CalendarEvent {
  type: "new" | "existing" | "edited" | "deleted";
  metadata: EventMetadata;
}

interface Message {
  content: string;
  isUser: boolean;
  isNew?: boolean;
  thinkingProcess?: string | null;
  isThinkingExpanded?: boolean;
  events?: CalendarEvent[];
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

interface EventCardProps {
  event: CalendarEvent;
}

const MotionBox = motion(Box);

function EventCard({ event }: EventCardProps) {
  const getEventTypeColor = () => {
    switch (event.type) {
      case "new":
        return "blue.100";
      case "existing":
        return "green.100";
      case "edited":
        return "yellow.100";
      case "deleted":
        return "red.100";
      default:
        return "gray.100";
    }
  };

  const getEventTypeIcon = () => {
    switch (event.type) {
      case "new":
        return <Icon as={FiPlus} color="blue.600" boxSize="1em" />;
      case "existing":
        return <Icon as={FiCheck} color="green.600" boxSize="1em" />;
      case "edited":
        return <Icon as={FiEdit} color="yellow.600" boxSize="1em" />;
      case "deleted":
        return <Icon as={FiTrash2} color="red.600" boxSize="1em" />;
      default:
        return <Icon as={FiCalendar} color="gray.600" boxSize="1em" />;
    }
  };

  const getEventTypeBorderColor = () => {
    switch (event.type) {
      case "new":
        return "blue.300";
      case "existing":
        return "green.300";
      case "edited":
        return "yellow.300";
      case "deleted":
        return "red.300";
      default:
        return "gray.300";
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeStr;
    }
  };

  const hasAttendees = event.metadata.attendees && event.metadata.attendees.length > 0;

  return (
    <Box
      bg={getEventTypeColor()}
      borderRadius="md"
      p={3}
      mb={2}
      border="1px solid"
      borderColor={getEventTypeBorderColor()}
      boxShadow="sm"
      userSelect="text"
      color="black"
    >
      <Flex align="center" gap={2}>
        {getEventTypeIcon()}
        <Text fontWeight="bold" fontSize="sm" color="black">
          {event.metadata.title}
        </Text>
      </Flex>

      <Text fontSize="xs" mt={1} color="black">
        {formatDateTime(event.metadata.start)} - {formatDateTime(event.metadata.end)}
      </Text>

      {hasAttendees && (
        <Box mt={2} pt={2} borderTop="1px solid" borderColor={getEventTypeBorderColor() + "80"}>
          <Text fontSize="xs" fontWeight="medium" color="black">
            Attendees:
          </Text>
          {event.metadata.attendees.map((attendee: string, i: number) => (
            <Text key={i} fontSize="xs" ml={2} color="black">
              {attendee}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
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

  const parseMessage = (message: string): { response: string; events?: CalendarEvent[] } => {
    try {
      const cleanMessage = message
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
      const jsonData = JSON.parse(cleanMessage);
      return {
        response: jsonData.response || message,
        events: jsonData.events || [],
      };
    } catch {
      return { response: message };
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
                      // Append to the thinking process instead of overwriting it
                      const existingThought = messages[i].thinkingProcess || "";
                      // Use a more prominent separator with line breaks and a divider
                      const separator = existingThought ? "\n\n----------\n\n" : "";
                      const updatedThought = existingThought + separator + parsedMessage.response;

                      // Update this message with the thinking process
                      messages[i] = {
                        ...messages[i],
                        thinkingProcess: updatedThought,
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

                  const parsedData = parseMessage(data.message);

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages: [
                        ...collapsedMessages,
                        {
                          content: parsedData.response,
                          isUser: false,
                          isNew: true,
                          events: parsedData.events,
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
                      // Append to the thinking process instead of overwriting it
                      const existingThought = messages[i].thinkingProcess || "";
                      // Use a more prominent separator with line breaks and a divider
                      const separator = existingThought ? "\n\n----------\n\n" : "";
                      const updatedThought = existingThought + separator + parsedMessage.response;

                      // Update this message with the thinking process
                      messages[i] = {
                        ...messages[i],
                        thinkingProcess: updatedThought,
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

                  const parsedData = parseMessage(data.message);

                  return {
                    ...prev,
                    [requestId]: {
                      ...currentSession,
                      messages: [
                        ...collapsedMessages,
                        {
                          content: parsedData.response,
                          isUser: false,
                          isNew: true,
                          events: parsedData.events,
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
      if (message.isUser) {
        result.push(<ChatMessage key={`msg-${i}`} content={message.content} isUser={true} isNew={!isFirstLoad.current && message.isNew} />);

        // If this is a user message and has thinking process, show it
        if (message.thinkingProcess) {
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
      // For agent messages
      else {
        // First add the agent message
        result.push(
          <ChatMessage key={`msg-${i}`} content={message.content} isUser={false} isNew={!isFirstLoad.current && message.isNew} />
        );

        // Then add events after the agent message with animation
        if (message.events && message.events.length > 0) {
          result.push(
            <Flex key={`events-${i}`} direction="column" ml={4} mt={2} mb={3}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1}>
                Event Information:
              </Text>
              <AnimatePresence>
                {message.events.map((event, eventIndex) => (
                  <MotionBox
                    key={`event-${i}-${eventIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: eventIndex * 0.2 }}
                  >
                    <EventCard event={event} />
                  </MotionBox>
                ))}
              </AnimatePresence>
            </Flex>
          );
        }
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
