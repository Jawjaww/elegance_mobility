import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        'plus-jakarta': ['var(--font-plus-jakarta)'],
      },
      keyframes: {
        'toast-bounce-in': {
          '0%':   { transform: 'translateY(-100%) scale(0.9)' },
          '50%':  { transform: 'translateY(8%)   scale(1.03)' },
          '70%':  { transform: 'translateY(-4%)   scale(1.01)' },
          '100%': { transform: 'translateY(0)     scale(1)' },
        },
        'toast-bounce-out': {
          '0%':   { transform: 'translateY(0)     scale(1)' },
          '30%':  { transform: 'translateY(4%)   scale(1.02)' },
          '100%': { transform: 'translateY(-100%) scale(0.9)' },
        },
      },
      animation: {
        'toast-bounce-in': 'toast-bounce-in 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
        'toast-bounce-out': 'toast-bounce-out 0.4s cubic-bezier(0.55,0.085,0.68,0.53)',
      },
    },
  },
  plugins: [],
} satisfies Config;
