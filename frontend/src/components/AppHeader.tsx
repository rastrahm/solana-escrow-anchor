"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { WalletStatus } from "@/components/wallet/WalletStatus";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * @description Cabecera con marca, navegación, tema y controles de wallet.
 * @returns Barra superior de la dApp.
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Solana Escrow
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            SPL atomic swap
          </p>
        </div>
        <nav aria-label="Principal" className="flex gap-3 text-sm">
          <NavLink href="/" active={pathname === "/"}>
            Inicio
          </NavLink>
          <NavLink href="/ayuda" active={pathname === "/ayuda"}>
            Ayuda
          </NavLink>
        </nav>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ConnectWalletButton />
        </div>
        <WalletStatus />
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "font-medium text-teal-800 underline dark:text-teal-300"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }
    >
      {children}
    </Link>
  );
}
