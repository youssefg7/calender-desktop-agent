import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/menu";
import { Avatar } from "@chakra-ui/avatar";
import { FiUser, FiSettings, FiLogOut, FiMenu } from "react-icons/fi";
import { motion } from "framer-motion";

const MotionButton = motion(Button);

interface NavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Navbar({ isSidebarOpen, onToggleSidebar }: NavbarProps) {
  return (
    <Box bg="gray.800" px={4} py={2} borderBottom="1px" borderColor="gray.700" w="100%" position="relative" zIndex={30}>
      <Flex justify="space-between" align="center" w="100%">
        <Flex align="center" gap={4}>
          <MotionButton
            size="sm"
            onClick={onToggleSidebar}
            borderRadius="full"
            bg="gray.700"
            _hover={{ bg: "gray.600" }}
            color="white"
            _active={{ transform: "scale(0.95)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <FiMenu />
            </motion.div>
          </MotionButton>
          <Text fontSize="xl" fontWeight="bold" color="white">
            Calendar Wizard
          </Text>
        </Flex>

        <Menu>
          <MenuButton>
            <Avatar size="sm" name="User" />
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            <MenuItem icon={<FiUser />} color="gray.300">
              Profile
            </MenuItem>
            <MenuItem icon={<FiSettings />} color="gray.300">
              Settings
            </MenuItem>
            <MenuItem icon={<FiLogOut />} color="gray.300">
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
}
