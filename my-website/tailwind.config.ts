import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            DEFAULT: "#0F294A",
            50: "#F0F4F8",
            100: "#D9E2EC",
            200: "#BCCCDC",
            300: "#9FB3C8",
            400: "#627D98",
            500: "#334E68",
            600: "#243B53",
            700: "#1E3A8A",
            800: "#133560",
            900: "#0F294A",
            950: "#0A1C33",
          },
          teal: {
            DEFAULT: "#0D9488",
            50: "#F0FDFA",
            100: "#CCFBF1",
            200: "#99F6E4",
            300: "#5EEAD4",
            400: "#2DD4BF",
            500: "#14B8A6",
            600: "#0D9488",
            700: "#0F766E",
            800: "#115E59",
            900: "#134E4A",
          },
          bg: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: [
          "Prompt",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Noto Sans Thai",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(15, 41, 74, 0.08), 0 4px 6px -4px rgba(15, 41, 74, 0.04)",
        card: "0 10px 25px -5px rgba(15, 41, 74, 0.06), 0 8px 10px -6px rgba(15, 41, 74, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
