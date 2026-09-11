import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Frappe "Awesome Bar" inspired neutral + brand palette
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#2490ef",
          600: "#2490ef",
          700: "#1a6ac4",
          800: "#1b579e",
          900: "#1d4b80",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
