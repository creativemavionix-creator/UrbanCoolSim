/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Editorial Warm Neutrals
        sand: {
          50: "#faf9f5",
          100: "#f4f2ea",
          200: "#eae6dc",
          300: "#dad4c5",
          400: "#b8b09d",
          800: "#3d3930",
          900: "#24221c",
        },
        // Dark Obsidian / Graphite Palette (Product World)
        obsidian: {
          base: "#0d0e11",
          subtle: "#14151a",
          surface: "#1b1d24",
          hover: "#242731",
          border: "rgba(255, 255, 255, 0.07)",
          borderHover: "rgba(255, 255, 255, 0.14)",
          textPrimary: "#f3f4f6",
          textSecondary: "#9ca3af",
          textMuted: "#6b7280",
        },
        // Botanical Accents
        botanical: {
          DEFAULT: "#15803d",
          light: "#22c55e",
          dark: "#14532d",
          subtle: "rgba(34, 197, 94, 0.12)",
        },
        // Thermal Semantic Scale
        thermal: {
          cool: "#0ea5e9",
          moderate: "#10b981",
          warm: "#f59e0b",
          intense: "#ea580c",
          extreme: "#dc2626",
        },
        // Legacy compatibility aliases mapped to new tokens
        background: "#0d0e11",
        card: "#14151a",
        cardHover: "#1b1d24",
        border: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        surface: "0 4px 20px -2px rgba(0, 0, 0, 0.25)",
        floating: "0 12px 32px -4px rgba(0, 0, 0, 0.4)",
      },
      letterSpacing: {
        tightest: "-0.03em",
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0",
        wide: "0.02em",
        wider: "0.05em",
        widest: "0.1em",
      },
    },
  },
  plugins: [],
};
