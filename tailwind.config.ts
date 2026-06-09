import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#407BB5",
        "primary-dark": "#2f5d8a",
        "primary-light": "#5a96d0",
        bg: "#F9F9F9",
      },
      fontFamily: {
        sans: ["var(--font-inter-sans)", "sans"],
      },
    },
  },
  plugins: [],
};

export default config;
