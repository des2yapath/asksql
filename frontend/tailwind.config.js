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
      // Every brand colour resolves through a CSS variable (see src/index.css)
      // rather than a hard-coded hex. That's what lets the console flip to a
      // dark theme by swapping one attribute instead of rewriting every
      // className - and it keeps the /N opacity modifiers working, because the
      // <alpha-value> placeholder is only valid on channels, not on a hex.
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
        },
        ink: "rgb(var(--ink) / <alpha-value>)",
        amber: {
          DEFAULT: "rgb(var(--amber) / <alpha-value>)",
          dark: "rgb(var(--amber-dark) / <alpha-value>)",
        },
        teal: {
          DEFAULT: "rgb(var(--teal) / <alpha-value>)",
          light: "rgb(var(--teal-light) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "rgb(var(--violet) / <alpha-value>)",
          dark: "rgb(var(--violet-dark) / <alpha-value>)",
        },
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      boxShadow: {
        // Theme-aware: light gets a soft diffuse panel shadow, dark gets a
        // deeper one (a light shadow is invisible against #0f1117).
        panel: "var(--shadow-panel)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "toast-in": "toast-in 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
