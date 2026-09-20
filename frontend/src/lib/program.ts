import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { PublicKey, type Connection, type Transaction } from "@solana/web3.js";
import idl from "@/lib/idl/escrow.json";
import { getSolanaClusterConfig } from "@/lib/cluster";
import type { Escrow } from "@/types/escrow";

export type EscrowProgram = Program<Escrow>;

export interface WalletLike {
  publicKey: PublicKey | null;
  signTransaction: <T extends Transaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction>(txs: T[]) => Promise<T[]>;
}

/**
 * @description Deriva la PDA de EscrowState.
 * @param programId - ID del programa escrow.
 * @param maker - Pubkey del maker.
 * @param seed - Seed u64 de la oferta.
 * @returns PDA del escrow.
 */
export function findEscrowPda(
  programId: PublicKey,
  maker: PublicKey,
  seed: BN
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    programId
  )[0];
}

/**
 * @description Deriva la PDA del vault de Token A.
 * @param programId - ID del programa escrow.
 * @param escrow - PDA del EscrowState.
 * @returns PDA del vault.
 */
export function findVaultPda(programId: PublicKey, escrow: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), escrow.toBuffer()],
    programId
  )[0];
}

/**
 * @description Crea el Program client tipado con el wallet adaptado.
 * @param connection - Conexión RPC.
 * @param wallet - Wallet adapter (debe estar conectado).
 * @returns Program Anchor del escrow.
 */
export function getEscrowProgram(
  connection: Connection,
  wallet: WalletLike
): EscrowProgram {
  if (!wallet.publicKey) {
    throw new Error("Wallet no conectada");
  }

  const provider = new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
  });

  const { programId } = getSolanaClusterConfig();
  return new Program(idl as Escrow, provider) as EscrowProgram;
}

export { BN };
