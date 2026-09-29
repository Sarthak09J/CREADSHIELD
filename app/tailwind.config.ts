import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CREDShield design language: near-black with purple/blue privacy accents
        background: "#0a0a0f",
        surface: "#111118",
        "surface-2": "#1a1a24",
        "surface-3": "#22222e",
        border: "#2a2a38",
        "border-subtle": "#1e1e28",
        accent: {
          DEFAULT: "#7c3aed", // purple
          hover: "#6d28d9",
          muted: "#4c1d95",
          subtle: "#1e1035",
        },
        blue: {
          accent: "#3b82f6",
          muted: "#1d4ed8",
          subtle: "#0f2044",
        },
        success: "#10b981",
        "success-subtle": "#052e16",
        warning: "#f59e0b",
        "warning-subtle": "#1c1307",
        danger: "#ef4444",
        "danger-subtle": "#1f0707",
        "text-primary": "#f8fafc",
        "text-secondary": "#94a3b8",
        "text-muted": "#475569",
        "text-disabled": "#334155",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "privacy-gradient":
          "linear-gradient(135deg, #0a0a0f 0%, #0f0a1f 50%, #0a0a0f 100%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(124, 58, 237, 0.15)",
        "glow-sm": "0 0 10px rgba(124, 58, 237, 0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
