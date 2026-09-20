/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Casino platform shell (dark navy)
        ink: {
          900: "#080a14", // page background
          800: "#0d1120", // deep panel / rail
          700: "#141a2e", // panel
          600: "#1b2238", // raised panel / row
          500: "#232c46", // hover
          400: "#2e3855", // border
        },
        mist: {
          100: "#eaeefb", // primary text
          300: "#aab4d4", // secondary text
          500: "#7b86a8", // muted text
        },
        // Accents
        gold: { DEFAULT: "#ffd426", dark: "#e0a800", deep: "#8a5a00" },
        punch: { DEFAULT: "#ff3d71", dark: "#d91d52" },
        mint: { DEFAULT: "#23d18b", dark: "#12a066" },
        sky: { DEFAULT: "#3d8bff", dark: "#1f63d6" },
        grape: { DEFAULT: "#a855f7", dark: "#7e2fd4" },
        // Felt table
        felt: { DEFAULT: "#116149", light: "#17805f", dark: "#0a3c2d" },
      },
      boxShadow: {
        panel: "0 10px 30px -12px rgba(0,0,0,0.75)",
        glow: "0 0 24px -4px rgba(255,212,38,0.5)",
        card: "0 1px 2px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.45)",
      },
      borderRadius: { xl2: "1.25rem" },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out both",
        "pulse-ring": "pulse-ring 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
