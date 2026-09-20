"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { BN, findEscrowPda, findVaultPda, getEscrowProgram } from "@/lib/program";
import type { EscrowView } from "@/types/escrow-view";
import type { MakeOfferFormInput } from "@/lib/schemas/offer";

export interface UseEscrowResult {
  escrows: EscrowView[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  makeOffer: (input: MakeOfferFormInput) => Promise<string>;
  takeOffer: (escrow: EscrowView) => Promise<string>;
  refund: (escrow: EscrowView) => Promise<string>;
}

/**
 * @description Hook de negocio para listar y operar escrows on-chain.
 * @returns Estado de lista + acciones make/take/refund.
 */
export function useEscrow(): UseEscrowResult {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [escrows, setEscrows] = useState<EscrowView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setEscrows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const program = getEscrowProgram(connection, {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: (wallet.signAllTransactions ?? (async (txs) => txs)).bind(
          wallet
        ),
      });
      const rows = await program.account.escrowState.all();
      setEscrows(
        rows.map((row) => ({
          publicKey: row.publicKey,
          maker: row.account.maker,
          mintA: row.account.mintA,
          mintB: row.account.mintB,
          receive: row.account.receive,
          seed: row.account.seed,
          bump: row.account.bump,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar escrows");
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const makeOffer = useCallback(
    async (input: MakeOfferFormInput): Promise<string> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Conectá la wallet primero");
      }
      const program = getEscrowProgram(connection, {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: (wallet.signAllTransactions ?? (async (txs) => txs)).bind(
          wallet
        ),
      });

      const mintA = new PublicKey(input.mintA);
      const mintB = new PublicKey(input.mintB);
      const seed = new BN(input.seed);
      const amount = new BN(input.amountA);
      const receive = new BN(input.receiveB);
      const escrow = findEscrowPda(program.programId, wallet.publicKey, seed);
      const vault = findVaultPda(program.programId, escrow);
      const makerAtaA = getAssociatedTokenAddressSync(
        mintA,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const sig = await program.methods
        .makeOffer(seed, receive, amount)
        .accountsPartial({
          maker: wallet.publicKey,
          mintA,
          mintB,
          makerAtaA,
          escrow,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await refresh();
      return sig;
    },
    [connection, wallet, refresh]
  );

  const takeOffer = useCallback(
    async (escrow: EscrowView): Promise<string> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Conectá la wallet primero");
      }
      const program = getEscrowProgram(connection, {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: (wallet.signAllTransactions ?? (async (txs) => txs)).bind(
          wallet
        ),
      });

      const vault = findVaultPda(program.programId, escrow.publicKey);
      const takerAtaA = getAssociatedTokenAddressSync(
        escrow.mintA,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const takerAtaB = getAssociatedTokenAddressSync(
        escrow.mintB,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const makerAtaB = getAssociatedTokenAddressSync(
        escrow.mintB,
        escrow.maker,
        false,
        TOKEN_PROGRAM_ID
      );

      const sig = await program.methods
        .takeOffer()
        .accountsPartial({
          taker: wallet.publicKey,
          maker: escrow.maker,
          escrow: escrow.publicKey,
          mintA: escrow.mintA,
          mintB: escrow.mintB,
          vault,
          takerAtaA,
          takerAtaB,
          makerAtaB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await refresh();
      return sig;
    },
    [connection, wallet, refresh]
  );

  const refund = useCallback(
    async (escrow: EscrowView): Promise<string> => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Conectá la wallet primero");
      }
      const program = getEscrowProgram(connection, {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: (wallet.signAllTransactions ?? (async (txs) => txs)).bind(
          wallet
        ),
      });

      const vault = findVaultPda(program.programId, escrow.publicKey);
      const makerAtaA = getAssociatedTokenAddressSync(
        escrow.mintA,
        wallet.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

      const sig = await program.methods
        .refund()
        .accountsPartial({
          maker: wallet.publicKey,
          escrow: escrow.publicKey,
          mintA: escrow.mintA,
          vault,
          makerAtaA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await refresh();
      return sig;
    },
    [connection, wallet, refresh]
  );

  return { escrows, loading, error, refresh, makeOffer, takeOffer, refund };
}
