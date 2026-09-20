import { describe, it, expect } from "vitest";
import { MakeOfferFormSchema } from "@/lib/schemas/offer";

describe("MakeOfferFormSchema", () => {
  it("acepta una oferta válida", () => {
    const result = MakeOfferFormSchema.safeParse({
      mintA: "So11111111111111111111111111111111111111112",
      mintB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amountA: 1,
      receiveB: 2,
      seed: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza amount <= 0", () => {
    const result = MakeOfferFormSchema.safeParse({
      mintA: "So11111111111111111111111111111111111111112",
      mintB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amountA: 0,
      receiveB: 2,
      seed: 42,
    });
    expect(result.success).toBe(false);
  });
});
