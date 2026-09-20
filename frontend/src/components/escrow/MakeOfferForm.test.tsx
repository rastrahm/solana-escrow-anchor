import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MakeOfferForm } from "@/components/escrow/MakeOfferForm";

describe("MakeOfferForm", () => {
  it("valida con Zod y llama onSubmit con datos parseados", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<MakeOfferForm onSubmit={onSubmit} disabled={false} />);

    await user.type(
      screen.getByLabelText(/mint a/i),
      "So11111111111111111111111111111111111111112"
    );
    await user.type(
      screen.getByLabelText(/mint b/i),
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );
    await user.clear(screen.getByLabelText(/amount a/i));
    await user.type(screen.getByLabelText(/amount a/i), "1000000");
    await user.clear(screen.getByLabelText(/receive b/i));
    await user.type(screen.getByLabelText(/receive b/i), "2000000");
    await user.clear(screen.getByLabelText(/seed/i));
    await user.type(screen.getByLabelText(/seed/i), "42");

    await user.click(screen.getByRole("button", { name: /crear oferta/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      mintA: "So11111111111111111111111111111111111111112",
      mintB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amountA: 1000000,
      receiveB: 2000000,
      seed: 42,
    });
  });

  it("muestra error de validación si amount es inválido", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<MakeOfferForm onSubmit={onSubmit} disabled={false} />);

    await user.type(
      screen.getByLabelText(/mint a/i),
      "So11111111111111111111111111111111111111112"
    );
    await user.type(
      screen.getByLabelText(/mint b/i),
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );
    await user.clear(screen.getByLabelText(/amount a/i));
    await user.type(screen.getByLabelText(/amount a/i), "0");
    await user.type(screen.getByLabelText(/receive b/i), "1");
    await user.type(screen.getByLabelText(/seed/i), "1");

    await user.click(screen.getByRole("button", { name: /crear oferta/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
