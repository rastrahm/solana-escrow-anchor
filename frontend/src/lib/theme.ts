export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "escrow-theme";

/**
 * @description Lee el tema guardado en localStorage (solo cliente).
 * @returns Tema válido o null si no hay valor.
 */
export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

/**
 * @description Resuelve el tema efectivo (storage o preferencia del sistema).
 * @returns Tema light o dark a aplicar en el documento.
 */
export function resolveInitialTheme(): Theme {
  const stored = readStoredTheme();
  if (stored) {
    return stored;
  }
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

/**
 * @description Aplica la clase `dark` en `<html>` según el tema.
 * @param theme - Tema a aplicar.
 */
export function applyThemeClass(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
