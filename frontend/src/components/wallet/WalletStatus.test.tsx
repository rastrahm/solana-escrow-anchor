import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WalletStatus } from "@/components/wallet/WalletStatus";

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: vi.fn(),
  useConnection: vi.fn(() => ({ connection: {} })),
}));

import { useWallet } from "@solana/wallet-adapter-react";

const mockUseWallet = vi.mocked(useWallet);

describe("WalletStatus", () => {
  it("muestra estado desconectado cuando no hay wallet", () => {
    mockUseWallet.mockReturnValue({
      connected: false,
      connecting: false,
      publicKey: null,
    } as ReturnType<typeof useWallet>);

    render(<WalletStatus />);

    expect(
      screen.getByRole("status", { name: /estado de la wallet/i })
    ).toHaveTextContent(/desconectada/i);
  });

  it("muestra estado conectado y pubkey truncada", () => {
    mockUseWallet.mockReturnValue({
      connected: true,
      connecting: false,
      publicKey: {
        toBase58: () => "2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS",
      },
    } as ReturnType<typeof useWallet>);

    render(<WalletStatus />);

    const status = screen.getByRole("status", {
      name: /estado de la wallet/i,
    });
    expect(status).toHaveTextContent(/conectada/i);
    expect(status).toHaveTextContent(/2nak96yk/);
  });
});
