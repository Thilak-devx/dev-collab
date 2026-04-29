/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        surface: {
          950: "#050816",
          900: "#091224",
          850: "#0f172d",
          800: "#162033",
        },
        text: {
          primary: "#f8fafc",
          muted: "#94a3b8",
          subtle: "#64748b",
        },
        stroke: {
          soft: "rgba(255, 255, 255, 0.12)",
          strong: "rgba(124, 58, 237, 0.34)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(2, 6, 23, 0.34)",
        glass: "0 18px 50px rgba(2, 6, 23, 0.42)",
        glow: "0 0 0 1px rgba(124, 58, 237, 0.18), 0 16px 48px rgba(76, 29, 149, 0.28)",
      },
      backgroundImage: {
        "dashboard-gradient":
          "radial-gradient(circle at top left, rgba(124, 58, 237, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #081226 45%, #0b1730 100%)",
        "glass-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))",
        grid: "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
