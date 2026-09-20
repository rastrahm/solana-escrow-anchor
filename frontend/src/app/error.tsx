"use client";

/**
 * @description Límite de error de la ruta principal.
 * @param error - Error capturado por Next.js.
 * @param reset - Callback para reintentar renderizar la ruta.
 * @returns UI de error accesible.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p role="alert" className="text-zinc-600 dark:text-zinc-400">
        {error.message || "Error inesperado en la aplicación."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-md bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
      >
        Reintentar
      </button>
    </main>
  );
}
