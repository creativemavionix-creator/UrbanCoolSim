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
        // 1. Base Surface (Graphite, not pure black)
        surface: {
          base: "#0B0C10",
          elevated: "#13151B",
          card: "#13151B",
          interactive: "#1B1E26",
          hover: "#222631",
          border: "rgba(255, 255, 255, 0.07)",
          borderHover: "rgba(255, 255, 255, 0.14)",
          borderActive: "rgba(255, 255, 255, 0.28)",
        },
        // 2. Signature Brand Accent (Electric Cobalt / Indigo — used sparingly)
        cobalt: {
          DEFAULT: "#4A6CFF",
          hover: "#5B7FFF",
          subtle: "rgba(74, 108, 255, 0.12)",
          border: "rgba(74, 108, 255, 0.35)",
        },
        // 3. Neutrals (Gray-on-graphite hierarchy)
        ink: {
          primary: "#F2F3F5",
          secondary: "#8E95A5",
          muted: "#5E6678",
          dim: "#3A404F",
        },
        // 4. Semantic / Status Colors (Reserved strictly for state mapping)
        status: {
          safe: "#10B981",       // Validated / Physics Ground Truth
          high: "#F59E0B",       // High Heat / Risk Tier
          critical: "#EF4444",   // Critical Risk Tier / >41.5°C
        },
        // 5. Scientific Colormap Scale (Domain data only: LST rasters)
        thermal: {
          cool: "#2563eb",
          mild: "#06b6d4",
          warm: "#f59e0b",
          hot: "#ea580c",
          extreme: "#dc2626",
        },
        // Legacy compatibility aliases
        background: "#0B0C10",
        card: "#13151B",
        cardHover: "#1B1E26",
        border: "rgba(255, 255, 255, 0.07)",
        botanical: {
          DEFAULT: "#4A6CFF",
          light: "#5B7FFF",
          dark: "#3B55CC",
        },
        obsidian: {
          base: "#0B0C10",
          subtle: "#13151B",
          surface: "#1B1E26",
          hover: "#222631",
          textPrimary: "#F2F3F5",
          textSecondary: "#8E95A5",
          textMuted: "#5E6678",
          border: "rgba(255, 255, 255, 0.07)",
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        surface: "0 4px 20px -2px rgba(0, 0, 0, 0.45)",
        floating: "0 12px 32px -4px rgba(0, 0, 0, 0.65)",
        cobaltGlow: "0 0 20px -2px rgba(74, 108, 255, 0.35)",
        specular: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.025em",
        tight: "-0.015em",
        normal: "0",
        wide: "0.025em",
        wider: "0.05em",
        widest: "0.12em",
      },
    },
  },
  plugins: [],
};
