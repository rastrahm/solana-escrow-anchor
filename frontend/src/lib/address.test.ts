import { describe, it, expect } from "vitest";
import { truncateAddress } from "@/lib/address";

describe("truncateAddress", () => {
  it("trunca pubkeys largas preservando inicio y final", () => {
    const full = "2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS";
    expect(truncateAddress(full, 8)).toBe("2nak96yk…XrAS");
  });

  it("devuelve la dirección intacta si es corta", () => {
    expect(truncateAddress("abcd", 8)).toBe("abcd");
  });
});
