"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const SolanaProviderDynamic = dynamic(
  async () =>
    (await import("@/components/providers/SolanaProvider")).SolanaProvider,
  { ssr: false }
);

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * @description Contenedor cliente de providers (Solana sin SSR).
 * @param children - Contenido de la app bajo providers.
 * @returns Árbol con SolanaProvider cargado solo en cliente.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <SolanaProviderDynamic>{children}</SolanaProviderDynamic>;
}
