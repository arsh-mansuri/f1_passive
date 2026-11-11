import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pit: {
          black: "#0A0A0A",
          surface: "#141414",
          raised: "#1B1B1B",
          line: "#262626",
          text: "#F5F5F5",
          muted: "#8A8A8A",
          dim: "#5C5C5C",
          red: "#E10600",
          "red-dark": "#B00500",
        },
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Archivo Black",
          "Arial Black",
          "Franklin Gothic Heavy",
          "sans-serif",
        ],
      },
      letterSpacing: {
        widest2: "0.22em",
      },
      boxShadow: {
        "red-glow": "0 0 40px rgba(225, 6, 0, 0.28)",
        "red-glow-sm": "0 0 18px rgba(225, 6, 0, 0.35)",
        card: "0 24px 80px rgba(0, 0, 0, 0.55)",
      },
      keyframes: {
        "track-dash": {
          "0%": { strokeDashoffset: "2400" },
          "100%": { strokeDashoffset: "0" },
        },
        "track-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) rotate(0deg)" },
          "50%": { transform: "translate3d(-1.5%, 1%, 0) rotate(0.6deg)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        "blink-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "90%": { opacity: "0.5" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
      },
      animation: {
        "track-dash": "track-dash 14s linear infinite",
        "track-drift": "track-drift 32s ease-in-out infinite",
        "soft-pulse": "soft-pulse 4s ease-in-out infinite",
        "blink-slow": "blink-slow 2.4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
