import { useState } from "react";

export function useSidebar() {
  const [isLeftOpen, setIsLeftOpen] = useState(false);

  const toggleLeft = () => {
    setIsLeftOpen((prev) => !prev);
  };

  return {
    isLeftOpen,
    toggleLeft,
  };
}
