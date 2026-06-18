/** @type {import('tailwindcss').Config} */
function withAlpha(varName) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces — swap between dark/light via CSS variables (see globals.css)
        base: withAlpha("--c-base"),
        surface: withAlpha("--c-surface"),
        raised: withAlpha("--c-raised"),
        elevated: withAlpha("--c-elevated"),
        line: withAlpha("--c-line"),
        "line-soft": withAlpha("--c-line-soft"),
        // Text
        ink: withAlpha("--c-ink"),
        sub: withAlpha("--c-sub"),
        faint: withAlpha("--c-faint"),
        dim: withAlpha("--c-dim"),
        // Accent
        accent: withAlpha("--c-accent"),
        "accent-bright": withAlpha("--c-accent-bright"),
        "accent-dim": withAlpha("--c-accent-dim"),
        // Semantic
        ok: withAlpha("--c-ok"),
        warn: withAlpha("--c-warn"),
        bad: withAlpha("--c-bad"),
        info: withAlpha("--c-info"),
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
