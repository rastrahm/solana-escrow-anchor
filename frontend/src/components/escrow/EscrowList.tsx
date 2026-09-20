"use client";

import { PublicKey } from "@solana/web3.js";
import { truncateAddress } from "@/lib/address";
import type { EscrowView } from "@/types/escrow-view";
import { TakeOfferButton } from "@/components/escrow/TakeOfferButton";
import { RefundButton } from "@/components/escrow/RefundButton";

export interface EscrowListProps {
  escrows: EscrowView[];
  walletPubkey: PublicKey | null;
  onTake: (escrow: EscrowView) => void;
  onRefund: (escrow: EscrowView) => void;
  busy: boolean;
}

/**
 * @description Lista escrows activos con acciones Take/Refund.
 * @param escrows - Ofertas on-chain.
 * @param walletPubkey - Wallet conectada (null si desconectada).
 * @param onTake - Callback al aceptar oferta.
 * @param onRefund - Callback al cancelar oferta propia.
 * @param busy - Deshabilita botones durante una tx.
 * @returns Lista accesible de escrows.
 */
export function EscrowList({
  escrows,
  walletPubkey,
  onTake,
  onRefund,
  busy,
}: EscrowListProps) {
  if (escrows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
        No hay escrows activos.
      </p>
    );
  }

  return (
    <ul aria-label="Escrows activos" className="space-y-3">
      {escrows.map((escrow) => {
        const isMaker =
          !!walletPubkey && escrow.maker.equals(walletPubkey);
        return (
          <li
            key={escrow.publicKey.toBase58()}
            className="rounded-md border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              Seed {escrow.seed.toString()}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Maker {truncateAddress(escrow.maker.toBase58())}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Recibe {escrow.receive.toString()} de Token B
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <TakeOfferButton
                disabled={busy || isMaker || !walletPubkey}
                onClick={() => onTake(escrow)}
              />
              <RefundButton
                disabled={busy || !isMaker}
                onClick={() => onRefund(escrow)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
