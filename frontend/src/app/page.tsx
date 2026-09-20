import { AppHeader } from "@/components/AppHeader";
import { getSolanaClusterConfig } from "@/lib/cluster";

/**
 * @description Home de la dApp: cabecera con wallet y resumen del cluster.
 * @returns Página inicial del escrow.
 */
export default async function HomePage() {
  const cluster = getSolanaClusterConfig();

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <section aria-labelledby="home-title" className="space-y-3">
          <h1 id="home-title" className="text-3xl font-semibold tracking-tight">
            Escrow SPL
          </h1>
          <p className="max-w-xl text-zinc-600">
            Intercambio atómico de tokens con programa Anchor. Conectá tu wallet
            para crear, tomar o cancelar ofertas (features en Fase 7).
          </p>
        </section>

        <section
          aria-label="Configuración de red"
          className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-700"
        >
          <p>
            <span className="font-medium text-zinc-900">Cluster:</span>{" "}
            {cluster.cluster}
          </p>
          <p className="break-all">
            <span className="font-medium text-zinc-900">RPC:</span>{" "}
            {cluster.rpcEndpoint}
          </p>
          <p className="break-all">
            <span className="font-medium text-zinc-900">Program ID:</span>{" "}
            {cluster.programId}
          </p>
        </section>
      </main>
    </>
  );
}
