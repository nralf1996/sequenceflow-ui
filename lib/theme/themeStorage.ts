export type ThemeMode = "light" | "dark";

const KEY = "sf_theme";

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(KEY);
  if (val === "light" || val === "dark") return val;
  return null;
}

export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, mode);
}
