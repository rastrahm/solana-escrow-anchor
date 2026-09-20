import { PublicKey } from "@solana/web3.js";
import type BN from "bn.js";

/**
 * Vista tipada de un escrow activo para la UI.
 */
export interface EscrowView {
  publicKey: PublicKey;
  maker: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  receive: BN;
  seed: BN;
  bump: number;
}

/**
 * Resultado de una acción de transacción en la UI.
 */
export interface TxResult {
  signature: string;
}
