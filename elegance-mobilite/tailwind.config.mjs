import forms from "@tailwindcss/forms";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Design-system extensions (merged colors)
      colors: {
        "neon-green": {
          DEFAULT: "#05c46b",
          light: "#9efbd1",
          bright: "#10ff8c",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.02)",
          mid: "rgba(255,255,255,0.06)",
          heavy: "rgba(255,255,255,0.12)",
        },
        bordeaux: "#7c2230",
        "bordeaux-icon": "#a0303a",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
      boxShadow: {
        "neon-sm": "0 8px 40px rgba(16,185,129,0.14)",
        "neon-lg": "0 24px 80px rgba(16,255,140,0.22)",
        "glass-inner": "inset 0 1px 0 rgba(255,255,255,0.02)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [forms, animate],
};

export default config;
