import { Flex } from "@chakra-ui/react";
import { Navbar } from "./Navbar";
import { ChatInterface } from "../chat/ChatInterface";
import { LeftSidebar } from "./LeftSidebar";
import { useSidebar } from "../../hooks/useSidebar";

export function MainLayout() {
  const { isLeftOpen, toggleLeft } = useSidebar();

  return (
    <Flex direction="column" h="100vh" w="100vw" bg="gray.900" overflow="hidden">
      <Flex flex="1" minW="0" position="relative">
        <LeftSidebar isOpen={isLeftOpen} />
        <Flex
          direction="column"
          flex="1"
          minW="0"
          position="absolute"
          left={isLeftOpen ? "240px" : "0"}
          right="0"
          top="0"
          bottom="0"
          transition="left 0.3s"
        >
          <Navbar isSidebarOpen={isLeftOpen} onToggleSidebar={toggleLeft} />
          <ChatInterface />
        </Flex>
      </Flex>
    </Flex>
  );
}
