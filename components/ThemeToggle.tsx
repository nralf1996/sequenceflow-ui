"use client";

import { useTheme } from "@/lib/theme/ThemeProvider";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "none",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "6px",
        color: "white",
        cursor: "pointer",
        fontSize: "16px",
        lineHeight: 1,
        padding: "4px 8px",
      }}
    >
      {mode === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
