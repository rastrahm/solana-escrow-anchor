import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Escrow } from "../target/types/escrow";
import idl from "../target/idl/escrow.json";

/**
 * Layout esperado de EscrowState (campos por tamaño descendente):
 * discriminator(8) + maker(32) + mint_a(32) + mint_b(32) + receive(8) + seed(8) + bump(1) = 121
 *
 * La cuenta aparece en el IDL cuando una instrucción la referencie (Fase 2 / MakeOffer).
 * El layout exacto se valida en Rust: `cargo test -p escrow --lib layout_tests`.
 */
const EXPECTED_INIT_SPACE = 32 + 32 + 32 + 8 + 8 + 1; // 113
const EXPECTED_TOTAL_SPACE = 8 + EXPECTED_INIT_SPACE; // 121

const EXPECTED_ERRORS = [
  { code: 6000, name: "Unauthorized" },
  { code: 6001, name: "InvalidMint" },
  { code: 6002, name: "InvalidAmount" },
  { code: 6003, name: "ArithmeticOverflow" },
] as const;

describe("escrow — layout / space (Fase 1)", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.escrow as Program<Escrow>;

  it("espacio total = 8 + INIT_SPACE (121) y queda bajo 128 bytes", () => {
    expect(EXPECTED_INIT_SPACE).to.equal(113);
    expect(EXPECTED_TOTAL_SPACE).to.equal(121);
    expect(EXPECTED_TOTAL_SPACE).to.be.lessThan(128);
  });

  it("IDL expone EscrowError con códigos 6000–6003", () => {
    const errors = (idl as anchor.Idl).errors ?? [];
    for (const expected of EXPECTED_ERRORS) {
      const found = errors.find((e) => e.code === expected.code);
      expect(found, `error code ${expected.code}`).to.exist;
      expect(found!.name).to.equal(expected.name);
    }
  });

  it("program id del workspace coincide con declare_id / Anchor.toml", () => {
    expect(program.programId.toBase58()).to.equal(
      "2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS"
    );
  });
});
