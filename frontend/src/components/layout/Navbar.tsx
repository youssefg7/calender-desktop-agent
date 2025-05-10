import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/menu";
import { Avatar } from "@chakra-ui/avatar";
import { FiUser, FiSettings, FiLogOut, FiMenu, FiCalendar, FiChevronDown } from "react-icons/fi";
import { motion } from "framer-motion";
import type { Calendar } from "../../types/calendar";

const MotionButton = motion(Button);

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  calendars?: Calendar[];
  selectedCalendarId?: string | null;
  onSelectCalendar?: (calendarId: string) => void;
  onTitleClick?: () => void;
}

export function Navbar({
  isSidebarOpen,
  onToggleSidebar,
  calendars = [],
  selectedCalendarId = null,
  onSelectCalendar = () => {},
}: NavbarProps) {
  // Find the selected calendar name
  const selectedCalendar = calendars.find((cal) => cal.id === selectedCalendarId);

  return (
    <Box bg="gray.800" px={3} py={1} borderBottom="1px" borderColor="gray.700" w="100%" h="100%" userSelect="none">
      <Flex justify="space-between" align="center" w="100%" h="100%">
        <Flex align="center" gap={3}>
          <MotionButton
            size="xs"
            onClick={onToggleSidebar}
            borderRadius="full"
            bg="gray.700"
            _hover={{ bg: "gray.600" }}
            color="white"
            _active={{ transform: "scale(0.95)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            p={1}
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <FiMenu size="0.9em" />
            </motion.div>
          </MotionButton>

          {/* Calendar Selector */}
          <Menu>
            <MenuButton as={Button} bg="gray.700" color="white" _hover={{ bg: "gray.600" }} _active={{ bg: "gray.600" }} size="xs">
              <Flex align="center">
                <FiCalendar style={{ marginRight: "6px" }} size="0.9em" />
                <Text fontSize="xs">{selectedCalendar ? selectedCalendar.name : "Select Account"}</Text>
                <FiChevronDown style={{ marginLeft: "6px" }} size="0.9em" />
              </Flex>
            </MenuButton>
            <MenuList bg="gray.800" borderColor="gray.700" zIndex={40} minW="150px">
              {calendars.map((calendar) => (
                <MenuItem
                  key={calendar.id}
                  onClick={() => onSelectCalendar(calendar.id)}
                  color="gray.300"
                  bg={selectedCalendarId === calendar.id ? "gray.700" : "transparent"}
                  _hover={{ bg: "gray.700" }}
                  fontSize="xs"
                  py={1}
                >
                  {calendar.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>

        <Menu>
          <MenuButton>
            <Avatar size="xs" name="User" />
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700" zIndex={40} minW="150px">
            <MenuItem icon={<FiUser size="0.9em" />} color="gray.300" fontSize="xs" py={1}>
              Profile
            </MenuItem>
            <MenuItem icon={<FiSettings size="0.9em" />} color="gray.300" fontSize="xs" py={1}>
              Settings
            </MenuItem>
            <MenuItem icon={<FiLogOut size="0.9em" />} color="gray.300" fontSize="xs" py={1}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
}
