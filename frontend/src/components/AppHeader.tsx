"use client";

import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { WalletStatus } from "@/components/wallet/WalletStatus";

/**
 * @description Cabecera con marca del escrow y controles de wallet.
 * @returns Barra superior de la dApp.
 */
export function AppHeader() {
  return (
    <header className="flex w-full items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4">
      <div>
        <p className="text-lg font-semibold tracking-tight text-zinc-900">
          Solana Escrow
        </p>
        <p className="text-xs text-zinc-500">SPL atomic swap</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <ConnectWalletButton />
        <WalletStatus />
      </div>
    </header>
  );
}
