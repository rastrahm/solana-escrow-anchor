import { AppHeader } from "@/components/AppHeader";
import { EscrowWorkbench } from "@/components/escrow/EscrowWorkbench";
import { getSolanaClusterConfig } from "@/lib/cluster";

/**
 * @description Home de la dApp con workbench de make/take/refund.
 * @returns Página inicial del escrow.
 */
export default async function HomePage() {
  const cluster = getSolanaClusterConfig();

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <section aria-labelledby="home-title" className="space-y-3">
          <h1
            id="home-title"
            className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Escrow SPL
          </h1>
          <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
            Creá, tomá o cancelá ofertas. Los montos son unidades base del mint
            (incluyen decimals). Cluster: {cluster.cluster}.{" "}
            <a
              href="/ayuda"
              className="text-teal-800 underline dark:text-teal-300"
            >
              Ver manual
            </a>
            .
          </p>
        </section>
        <EscrowWorkbench />
      </main>
    </>
  );
}
