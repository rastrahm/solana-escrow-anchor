import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HelpManual } from "@/components/help/HelpManual";

describe("HelpManual", () => {
  it("explica qué hace el escrow y cómo operar Make/Take/Refund", () => {
    render(<HelpManual />);

    expect(
      screen.getByRole("heading", { name: /manual de ayuda/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /qué hace/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cómo lo hace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /crear oferta/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /tomar oferta/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /cancelar oferta/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/transfer_checked/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PDA/i).length).toBeGreaterThan(0);
  });
});
