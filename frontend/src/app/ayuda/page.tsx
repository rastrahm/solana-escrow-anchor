import { AppHeader } from "@/components/AppHeader";
import { HelpManual } from "@/components/help/HelpManual";

/**
 * @description Página del manual de ayuda de la dApp.
 * @returns Manual de uso del escrow.
 */
export default function HelpPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10">
        <HelpManual />
      </main>
    </>
  );
}
