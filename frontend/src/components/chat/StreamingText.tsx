import { Text } from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
}

export function StreamingText({ text, onComplete }: StreamingTextProps) {
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
          // Add a 3-second delay before marking as not typing
          setTimeout(() => {
            setIsTyping(false);
            onComplete?.();
          }, 3000);
          return;
        }

        const newText = shouldStreamByWords ? tokens.slice(0, index + 1).join(" ") : tokens.slice(0, index + 1).join("");

        setDisplayedText(newText);
        index++;
      },
      shouldStreamByWords ? 50 : 30
    );

    return () => clearInterval(interval);
  }, [text, onComplete]);

  useEffect(() => {
    const cleanup = streamText();
    return () => {
      if (cleanup) cleanup();
    };
  }, [streamText]);

  return (
    <Text fontSize="lg" lineHeight="tall">
      {displayedText}
      {isTyping && (
        <Text as="span" color="blue.400" fontWeight="bold" animation="blink 1s step-end infinite">
          |
        </Text>
      )}
    </Text>
  );
}
