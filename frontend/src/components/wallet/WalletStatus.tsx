"use client";

import { truncateAddress } from "@/lib/address";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * @description Muestra si la wallet está conectada o desconectada (accesible).
 * @returns Región `status` con el estado actual de la wallet.
 */
export function WalletStatus() {
  const { connected, connecting, publicKey } = useWallet();

  let label = "Wallet desconectada";
  if (connecting) {
    label = "Conectando wallet…";
  } else if (connected && publicKey) {
    label = `Wallet conectada: ${truncateAddress(publicKey.toBase58())}`;
  }

  return (
    <p
      role="status"
      aria-label="Estado de la wallet"
      className="text-sm text-zinc-600"
    >
      {label}
    </p>
  );
}
