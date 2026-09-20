/**
 * @description Schema Zod de ejemplo para params de oferta (Fase 7).
 */
import { z } from "zod";

export const PublicKeySchema = z
  .string()
  .min(32, "Pubkey demasiado corta")
  .max(64, "Pubkey inválida");

export const MakeOfferFormSchema = z.object({
  mintA: PublicKeySchema,
  mintB: PublicKeySchema,
  amountA: z.coerce.number().positive("amount debe ser > 0"),
  receiveB: z.coerce.number().positive("receive debe ser > 0"),
  seed: z.coerce.number().int().nonnegative(),
});

export type MakeOfferFormInput = z.infer<typeof MakeOfferFormSchema>;
