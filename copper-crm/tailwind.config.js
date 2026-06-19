/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        primary: { DEFAULT: "#331405", dark: "#6f381a", light: "#e3d6c5", container: "#c57e5b", fixed: "#e3d6c5" },
        studio: {
          background: "#f0ede4",
          surface: "#e3d6c5",
          card: "#e3d6c5",
          border: "#e3d6c5",
          muted: "#331405",
          copper: "#331405",
        },
        /* Copper Studio OS tokens (for client portal) */
        "cs-primary": "#331405",
        "cs-primary-container": "#c57e5b",
        "cs-primary-fixed": "#e3d6c5",
        "cs-on-primary": "#f0ede4",
        "cs-background": "#f0ede4",
        "cs-surface": "#f0ede4",
        "cs-surface-lowest": "#f0ede4",
        "cs-surface-low": "#f2f4f6",
        "cs-surface-container": "#edeef0",
        "cs-surface-high": "#e7e8ea",
        "cs-surface-highest": "#e1e2e4",
        "cs-outline-variant": "#e3d6c5",
        "cs-on-surface": "#101010",
        "cs-on-surface-variant": "#331405",
        "cs-secondary": "#555f6d",
        "cs-error": "#ba1a1a",
        /* Material Design color tokens used in UI HTML */
        "surface-container-lowest": "#f0ede4",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#edeef0",
        "surface-container-high": "#e7e8ea",
        "surface-container-highest": "#e1e2e4",
        "primary-container": "#c57e5b",
        "primary-fixed": "#e3d6c5",
        "primary-fixed-dim": "#ffb77b",
        "outline-variant": "#e3d6c5",
        "on-surface": "#101010",
        "on-surface-variant": "#331405",
        "secondary-container": "#d6e0f1",
        "surface-bright": "#f0ede4",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 4px 16px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
