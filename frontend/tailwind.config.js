/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        ink: "#12172A",
        canvas: "#F5F6F8",
        amber: {
          DEFAULT: "#E8A33D",
          dark: "#C6822A",
        },
        teal: {
          DEFAULT: "#1B8F72",
          light: "#E4F5F0",
        },
        violet: {
          DEFAULT: "#5B4FE8",
          dark: "#4438C9",
        },
        danger: "#D64545",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(18, 23, 42, 0.04), 0 8px 24px rgba(18, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
