"use client";

/**
 * @description Muestra un mensaje de error o éxito de transacción (accesible).
 * @param message - Texto a mostrar; null oculta el aviso.
 * @param tone - Estilo visual del mensaje.
 * @returns Región alert o null.
 */
export function TxMessage({
  message,
  tone = "error",
}: {
  message: string | null;
  tone?: "error" | "success";
}) {
  if (!message) {
    return null;
  }

  const className =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      : "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-100";

  return (
    <p
      role="alert"
      aria-live="polite"
      className={`rounded-md border px-3 py-2 text-sm ${className}`}
    >
      {message}
    </p>
  );
}
