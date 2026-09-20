"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * @description Botón para alternar entre modo claro y oscuro.
 * @returns Control accesible de tema.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
    >
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
