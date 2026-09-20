import { z } from "zod";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";

/**
 * @description Schema Zod del cluster Solana expuesto al frontend.
 */
export const ClusterEnvSchema = z.object({
  NEXT_PUBLIC_SOLANA_CLUSTER: z
    .enum(["localnet", "devnet", "testnet", "mainnet-beta"])
    .default("devnet"),
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().url().optional(),
  NEXT_PUBLIC_ESCROW_PROGRAM_ID: z
    .string()
    .min(32)
    .default("2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS"),
});

export type ClusterEnv = z.infer<typeof ClusterEnvSchema>;

export interface SolanaClusterConfig {
  cluster: "localnet" | Cluster;
  rpcEndpoint: string;
  programId: string;
}

/**
 * @description Lee y valida variables de entorno del cluster Solana.
 * @returns Config tipada con endpoint RPC y program id del escrow.
 */
export function getSolanaClusterConfig(): SolanaClusterConfig {
  const parsed = ClusterEnvSchema.parse({
    NEXT_PUBLIC_SOLANA_CLUSTER: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_ESCROW_PROGRAM_ID: process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID,
  });

  const cluster = parsed.NEXT_PUBLIC_SOLANA_CLUSTER;

  if (cluster === "localnet") {
    return {
      cluster,
      rpcEndpoint: parsed.NEXT_PUBLIC_SOLANA_RPC_URL ?? "http://127.0.0.1:8899",
      programId: parsed.NEXT_PUBLIC_ESCROW_PROGRAM_ID,
    };
  }

  return {
    cluster,
    rpcEndpoint: parsed.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl(cluster),
    programId: parsed.NEXT_PUBLIC_ESCROW_PROGRAM_ID,
  };
}
