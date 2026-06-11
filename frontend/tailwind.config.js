/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#00D1C9", light: "#E0FAFA", dark: "#00A8A2" },
        purple: { DEFAULT: "#5A00FF", light: "#EDE8FF", dark: "#4400CC" },
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Syne'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
