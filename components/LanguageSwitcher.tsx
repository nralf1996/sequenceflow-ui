"use client";

import { useTranslation, type Language } from "@/lib/i18n/LanguageProvider";

const LANGUAGES: Language[] = ["en", "nl"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {LANGUAGES.map((lang) => {
        const isActive = lang === language;
        return (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            style={{
              background: isActive ? "var(--surface)" : "transparent",
              border: isActive
                ? "1px solid var(--border)"
                : "1px solid transparent",
              borderRadius: "5px",
              padding: "3px 7px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: isActive ? 700 : 400,
              color: isActive ? "var(--text)" : "var(--muted)",
              letterSpacing: "0.06em",
              lineHeight: 1,
              transition: "all 0.15s",
            }}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
