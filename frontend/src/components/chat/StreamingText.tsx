import { Text, Box } from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
  renderMarkdown?: boolean;
}

export function StreamingText({ text, onComplete, renderMarkdown = false }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const streamText = useCallback(() => {
    if (!text) return;

    // Reset state when text changes
    setDisplayedText("");
    setIsTyping(true);

    // Determine if we should stream by words or characters based on text length
    const shouldStreamByWords = text.length > 100;
    const tokens = shouldStreamByWords ? text.split(" ") : text.split("");

    let index = 0;
    const interval = setInterval(
      () => {
        if (index >= tokens.length) {
          clearInterval(interval);
          // Add a shorter delay for markdown rendering
          setTimeout(
            () => {
              setIsTyping(false);
              onComplete?.();
            },
            renderMarkdown ? 1000 : 3000
          );
          return;
        }

        const newText = shouldStreamByWords ? tokens.slice(0, index + 1).join(" ") : tokens.slice(0, index + 1).join("");

        setDisplayedText(newText);
        index++;
      },
      shouldStreamByWords ? 50 : 30
    );

    return () => clearInterval(interval);
  }, [text, onComplete, renderMarkdown]);

  useEffect(() => {
    const cleanup = streamText();
    return () => {
      if (cleanup) cleanup();
    };
  }, [streamText]);

  return (
    <>
      {renderMarkdown ? (
        <Box className="markdown-content" fontSize="md" lineHeight="tall">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
          {isTyping && (
            <Text as="span" color="blue.400" fontWeight="bold" animation="blink 1s step-end infinite">
              |
            </Text>
          )}
        </Box>
      ) : (
        <Text fontSize="lg" lineHeight="tall">
          {displayedText}
          {isTyping && (
            <Text as="span" color="blue.400" fontWeight="bold" animation="blink 1s step-end infinite">
              |
            </Text>
          )}
        </Text>
      )}
    </>
  );
}
