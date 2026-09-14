/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#fafafa",
        "surface": "#ffffff",
        "surface-subtle": "#f4f4f5",
        "surface-muted": "#e4e4e7",
        "border-subtle": "#e4e4e7",
        "border-strong": "#d4d4d8",
        "primary": "#18181b",
        "secondary": "#71717a",
        "dark-bg": "#09090b",
        "dark-surface": "#121215",
        "dark-border": "#27272a",
      },
      fontFamily: {
        sans: ["Geist", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      }
    },
  },
  plugins: [],
}