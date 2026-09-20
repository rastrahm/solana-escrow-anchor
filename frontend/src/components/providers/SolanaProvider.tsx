"use client";

import { getSolanaClusterConfig } from "@/lib/cluster";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo, type ReactNode } from "react";

import "@solana/wallet-adapter-react-ui/styles.css";

export interface SolanaProviderProps {
  children: ReactNode;
}

/**
 * @description Proveedores de conexión RPC y wallets Solana para la dApp.
 * @param children - Árbol React cliente que necesita acceso a wallet/RPC.
 * @returns Providers anidados de Connection, Wallet y Modal.
 */
export function SolanaProvider({ children }: SolanaProviderProps) {
  const config = useMemo(() => getSolanaClusterConfig(), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={config.rpcEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
