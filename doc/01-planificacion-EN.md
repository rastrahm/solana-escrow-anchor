# Step-by-step planning — SPL Escrow + Frontend

🇪🇸 [Versión en español](./01-planificacion-ES.md) · [Index](./README.md)

An ordered guide to build the project from scratch. Every phase assumes TDD: tests first, implementation second.

## Progress

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Monorepo setup | ✅ Completed |
| 1 | On-chain state model | ✅ Completed |
| 2 | MakeOffer (TDD) | ✅ Completed |
| 3 | TakeOffer (atomic swap) | ✅ Completed |
| 4 | Refund | ✅ Completed |
| 5 | On-chain hardening | ✅ Completed |
| 6 | Frontend: Next.js base | ✅ Completed |
| 7 | Frontend: features (TDD UI) | ✅ Completed |
| 8 | Integration and deployment | ✅ Completed |

---

## Phase 0 — Monorepo setup ✅

> **Status: completed** (branch `bootstrap`).

- [x] Initialize git (if it does not exist yet) and confirm `.gitignore` at the root.
- [x] Create the Anchor workspace at the root (`programs/`, `tests/`, `Anchor.toml`, `Cargo.toml`).
- [x] Create the Next.js frontend app in `frontend/` (App Router + Tailwind + `src/`).
- [x] Align versions:
  - **Node ≥ 20.18** (use `nvm use` + `.nvmrc` → 22.22.2)
  - **Anchor 0.31.1** / Solana CLI 2.2.x
  - **platform-tools v1.52** to compile (see below)
- [x] Verify `declare_id!` == keypair pubkey in `target/deploy/` (ignored by git).
- [x] Exit criteria: `npm run build:program` and `npm run build:frontend` with no errors.

### Compiling the program

Solana 2.2.x ships platform-tools **v1.48** (cargo 1.84), which is incompatible with `edition2024` crates. Use the repo script:

```bash
npm run build:program    # cargo-build-sbf --tools-version v1.52 + IDL
npm run build:frontend   # next build
npm run dev:frontend     # next dev
```

---

## Phase 1 — On-chain state model ✅

> **Status: completed.**

- [x] Define `EscrowState` with `#[account]` + `#[derive(InitSpace)]`.
- [x] Order fields by descending size (`Pubkey` → `u64` → `u8`):
  - `maker`, `mint_a`, `mint_b`
  - `receive` (expected Token B amount)
  - `seed`, `bump`
- [x] Compute space: `EscrowState::SPACE = 8 + INIT_SPACE` = **121** (< 128).
- [x] Document seeds: `[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()]` (`ESCROW_SEED`).
- [x] Define `EscrowError`: `Unauthorized`, `InvalidMint`, `InvalidAmount`, `ArithmeticOverflow`.
- [x] Exit criteria: layout tests passing.

```bash
npm run test:layout     # Rust: INIT_SPACE / SPACE / seed
npm run test:program    # build + TS tests (IDL errors + space)
```

---

## Phase 2 — MakeOffer (TDD) ✅

> **Status: completed.**

- [x] Test first: maker creates the escrow, vault receives Token A, state is correct.
- [x] Implement `make_offer`:
  - `init` of `EscrowState` (payer = maker)
  - `init` vault ATA with authority = escrow PDA
  - CPI `transfer_checked` maker → vault
- [x] Explicit constraints: `seeds`, `bump`, `token_program` via `TokenInterface`.
- [x] Document the instruction (notice / accounts / return).
- [x] Exit criteria: MakeOffer tests passing (`npm run test:program`).

```bash
npm run test:program
```

---

## Phase 3 — TakeOffer (atomic swap) ✅

> **Status: completed.**

- [x] Test first: taker pays Token B; receives Token A; vault/escrow close; rent goes to the maker.
- [x] Implement:
  - Taker → Maker: `transfer_checked` (Token B)
  - Vault → Taker: `transfer_checked` with PDA signer
  - `close_account` on the vault + `close = maker` on EscrowState
- [x] Fake mint test (account substitution) → fails.
- [x] Exit criteria: `npm run test:program` (8 tests) passing.

---

## Phase 4 — Refund ✅

> **Status: completed.**

- [x] Test first: only the maker can cancel; recovers Token A + rent.
- [x] Implement refund: PDA signer + `close_account` vault + `close = maker`.
- [x] Attack test: a non-maker tries to refund → error.
- [x] Exit criteria: `npm run test:program` (10 tests) passing.

---

## Phase 5 — On-chain hardening ✅

> **Status: completed.**

- [x] Review ownership, signers, account substitution ([05-registro-ataques-EN.md](./05-registro-ataques-EN.md)).
- [x] Confirm `transfer_checked` only (`npm run harden:check`).
- [x] Measure compute units (MakeOffer < 100k via simulation).
- [x] Layout benchmark: 121 bytes Borsh packed, little-endian, `Pubkey`→`u64`→`u8`.
- [x] Security tests: receive=0, same mint, fake mint, non-maker refund, on-chain offsets.
- [x] Criteria: `npm run test:harden` — 14 TS tests + 7 Rust layout tests + harden-check.

```bash
npm run test:harden
```

> Note: persistence is **Solana/SBF + Borsh**, not an EVM storage layout.

---

## Phase 6 — Frontend: Next.js base ✅

> **Status: completed.**

- [x] App Router: `layout`, `page`, `error.tsx`, `not-found.tsx`.
- [x] Deps: wallet-adapter, Anchor, Zod, Vitest + RTL.
- [x] `SolanaProvider` + cluster validated with Zod (`devnet`/`localnet`).
- [x] Strict typing + explicit `'use client'` / server components.
- [x] `WalletStatus` (TDD) shows connected/disconnected.
- [x] Criteria: `npm --prefix frontend test` (6) + `npm run build:frontend`.

```bash
npm run dev:frontend
npm --prefix frontend test
```

---

## Phase 7 — Frontend: features (TDD UI) ✅

> **Status: completed.**

- [x] MakeOfferForm (Zod + TDD)
- [x] EscrowList + TakeOfferButton + RefundButton (TDD)
- [x] `useEscrow` hook + Anchor client (`idl` in `frontend/src/lib/idl`)
- [x] Accessible transaction messages (`role="alert"`)
- [x] Test criteria: `npm run test:frontend` (10) + build OK

```bash
npm run dev:frontend
npm run test:frontend
```

Manual localnet flow (Phase 8 formalizes the deployment): connect wallet → create offer → take or refund.

---

## Phase 8 — Integration and deployment ✅

> **Status: completed** (devnet + README + checklist).

- [x] Deploy the program to **devnet** (`2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS`).
- [x] Update IDL and ID: `Anchor.toml` `[programs.devnet]`, `frontend/src/lib/idl/`.
- [x] Environment variables (`.env.example` / `.env.local`; no secrets in git).
- [x] Security checklist ([05-registro-ataques-EN.md](./05-registro-ataques-EN.md) + `solana.cursorrules` + `.cursorrules`).
- [x] User README at the root: build, test and UI.
- [x] Exit criteria: program live on devnet + frontend pointing to the same Program ID.

---

## Target folder structure

```
solana-escrow-anchor/
├── .cursorrules
├── nextjs.cursorrules
├── solana.cursorrules
├── .gitignore
├── Anchor.toml
├── Cargo.toml
├── doc/                    # this documentation
├── programs/
│   └── escrow/
│       └── src/
│           ├── lib.rs
│           ├── state.rs
│           ├── errors.rs
│           └── instructions/
│               ├── mod.rs
│               ├── make_offer.rs
│               ├── take_offer.rs
│               └── refund.rs
├── tests/
│   └── escrow.ts
├── target/                 # build output (ignored)
└── frontend/               # Next.js App Router
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/            # IDL, program client, Zod schemas
    │   └── actions/        # Server Actions if needed
    └── ...
```

---

## Recommended work order (summary)

```
Setup → State → MakeOffer → TakeOffer → Refund → Hardening
                                                      ↓
                                              Frontend base
                                                      ↓
                                         Make / List / Take / Refund UI
                                                      ↓
                                              Devnet + user docs
```
