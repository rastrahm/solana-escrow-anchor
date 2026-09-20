import Link from "next/link";

/**
 * @description Página 404 de la dApp.
 * @returns Mensaje de ruta no encontrada con enlace al inicio.
 */
export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-xl flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-zinc-600">
        La ruta solicitada no existe en Solana Escrow.
      </p>
      <Link
        href="/"
        className="w-fit text-sm font-medium text-teal-800 underline"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
