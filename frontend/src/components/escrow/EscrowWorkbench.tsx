"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { MakeOfferForm } from "@/components/escrow/MakeOfferForm";
import { EscrowList } from "@/components/escrow/EscrowList";
import { TxMessage } from "@/components/ui/TxMessage";
import { useEscrow } from "@/hooks/useEscrow";
import type { EscrowView } from "@/types/escrow-view";
import type { MakeOfferFormInput } from "@/lib/schemas/offer";

/**
 * @description Panel cliente: crear oferta + listar/tomar/cancelar escrows.
 * @returns Workbench interactivo del escrow.
 */
export function EscrowWorkbench() {
  const wallet = useWallet();
  const { escrows, loading, error, refresh, makeOffer, takeOffer, refund } =
    useEscrow();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<string>,
    okText: string
  ): Promise<void> {
    setBusy(true);
    setMessage(null);
    try {
      const sig = await action();
      setTone("success");
      setMessage(`${okText}: ${sig.slice(0, 16)}…`);
    } catch (err) {
      setTone("error");
      setMessage(err instanceof Error ? err.message : "Error de transacción");
    } finally {
      setBusy(false);
    }
  }

  async function handleMake(input: MakeOfferFormInput) {
    await run(() => makeOffer(input), "Oferta creada");
  }

  async function handleTake(escrow: EscrowView) {
    await run(() => takeOffer(escrow), "Oferta tomada");
  }

  async function handleRefund(escrow: EscrowView) {
    await run(() => refund(escrow), "Oferta cancelada");
  }

  return (
    <div className="space-y-8">
      <MakeOfferForm
        onSubmit={handleMake}
        disabled={!wallet.connected || busy}
      />

      <section aria-labelledby="escrow-list-title" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="escrow-list-title" className="text-lg font-semibold">
            Escrows activos
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="text-sm text-teal-800 underline"
          >
            Actualizar
          </button>
        </div>
        {loading ? (
          <p role="status" className="text-sm text-zinc-500">
            Cargando…
          </p>
        ) : null}
        <TxMessage message={error ?? message} tone={error ? "error" : tone} />
        <EscrowList
          escrows={escrows}
          walletPubkey={wallet.publicKey}
          onTake={(e) => void handleTake(e)}
          onRefund={(e) => void handleRefund(e)}
          busy={busy}
        />
      </section>
    </div>
  );
}
