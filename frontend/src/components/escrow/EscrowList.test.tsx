import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";
import { EscrowList } from "@/components/escrow/EscrowList";
import type { EscrowView } from "@/types/escrow-view";

const maker = Keypair.generate().publicKey;

const sample: EscrowView = {
  publicKey: Keypair.generate().publicKey,
  maker,
  mintA: Keypair.generate().publicKey,
  mintB: Keypair.generate().publicKey,
  receive: new BN(2_000_000),
  seed: new BN(42),
  bump: 255,
};

describe("EscrowList", () => {
  it("muestra vacío cuando no hay escrows", () => {
    render(
      <EscrowList
        escrows={[]}
        walletPubkey={null}
        onTake={vi.fn()}
        onRefund={vi.fn()}
        busy={false}
      />
    );
    expect(screen.getByText(/no hay escrows activos/i)).toBeInTheDocument();
  });

  it("permite take si no soy maker y refund si soy maker", async () => {
    const user = userEvent.setup();
    const onTake = vi.fn();
    const onRefund = vi.fn();
    const stranger = Keypair.generate().publicKey;

    const { rerender } = render(
      <EscrowList
        escrows={[sample]}
        walletPubkey={stranger}
        onTake={onTake}
        onRefund={onRefund}
        busy={false}
      />
    );

    expect(screen.getByText(/seed 42/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /tomar oferta/i }));
    expect(onTake).toHaveBeenCalledWith(sample);

    rerender(
      <EscrowList
        escrows={[sample]}
        walletPubkey={maker}
        onTake={onTake}
        onRefund={onRefund}
        busy={false}
      />
    );
    await user.click(screen.getByRole("button", { name: /cancelar oferta/i }));
    expect(onRefund).toHaveBeenCalledWith(sample);
  });
});
