"use client";

import dynamic from "next/dynamic";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

/**
 * @description Botón oficial del wallet-adapter para conectar/desconectar.
 * @returns Botón de conexión de wallet (solo cliente).
 */
export function ConnectWalletButton() {
  return (
    <WalletMultiButtonDynamic
      aria-label="Conectar o desconectar wallet"
      className="!bg-teal-700 hover:!bg-teal-800 !h-10 !rounded-md !text-sm"
    />
  );
}
