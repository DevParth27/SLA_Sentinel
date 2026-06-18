/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — near-black charcoal stack
        base: "#08090C",
        surface: "#101319",
        raised: "#161A21",
        elevated: "#1C212A",
        line: "#23282F",
        "line-soft": "#1A1E25",
        // Text
        ink: "#F3F5F8",
        sub: "#A2A9B4",
        faint: "#646B77",
        dim: "#454B55",
        // Accent — electric blue
        accent: "#5B8DEF",
        "accent-bright": "#7DA8FF",
        "accent-dim": "#3D6BC4",
        // Semantic
        ok: "#3DDC97",
        warn: "#F5B544",
        bad: "#FF6B6B",
        info: "#5B8DEF",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,141,239,0.25), 0 8px 30px -8px rgba(91,141,239,0.45)",
        "glow-sm": "0 0 20px -6px rgba(91,141,239,0.5)",
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 40px -16px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "accent-grad": "linear-gradient(135deg, #5B8DEF 0%, #7C7BF7 100%)",
      },
    },
  },
  plugins: [],
};
