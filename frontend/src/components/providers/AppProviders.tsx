"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const SolanaProviderDynamic = dynamic(
  async () =>
    (await import("@/components/providers/SolanaProvider")).SolanaProvider,
  { ssr: false }
);

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * @description Contenedor cliente de providers (tema + Solana sin SSR).
 * @param children - Contenido de la app bajo providers.
 * @returns Árbol con ThemeProvider y SolanaProvider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SolanaProviderDynamic>{children}</SolanaProviderDynamic>
    </ThemeProvider>
  );
}
