import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f2ff" },
          100: { value: "#bfdeff" },
          200: { value: "#99caff" },
          300: { value: "#73b6ff" },
          400: { value: "#4da2ff" },
          500: { value: "#1a8cff" },
          600: { value: "#0073e6" },
          700: { value: "#005bb4" },
          800: { value: "#004282" },
          900: { value: "#002851" },
        },
      },
    },
  },
});
