# Solana Escrow (Anchor + Next.js)

🇪🇸 [Versión en español](./README-ES.md) · [Index](./README.md)

Atomic escrow for SPL tokens (legacy + Token-2022) with an Anchor program and a Next.js App Router UI.

**Program ID (localnet / devnet):** `2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS`

Explorer (devnet):  
https://explorer.solana.com/address/2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS?cluster=devnet

---

## Requirements

- Node.js ≥ 20.18 (22 recommended)
- Rust 1.75+
- Solana CLI 2.x
- Anchor CLI 0.31.x
- A wallet with SOL on **devnet** (faucet) to send transactions from the UI

The SBF build uses platform-tools **v1.52** (`npm run build:program`) because `edition2024` crates do not compile with the default v1.48.

---

## On-chain program

```bash
# Build (.so + IDL)
npm run build:program

# Tests (localnet / bankrun via Anchor)
npm run test:program

# Hardening: static checks + layout + suite
npm run test:harden

# Deploy to devnet (uses ~/.config/solana/id.json)
anchor deploy --provider.cluster devnet
```

Instructions:

| Instruction   | Who    | Effect |
|---------------|--------|--------|
| `make_offer`  | Maker  | Deposits Token A into the vault PDA; creates `EscrowState` |
| `take_offer`  | Taker  | Pays Token B to the maker; receives Token A; closes vault + state |
| `refund`      | Maker  | Cancels; recovers Token A + rent |

Seeds: `escrow` = `[b"escrow", maker, seed]`; vault = `[b"vault", escrow]`.

Design documentation: [`doc/README-EN.md`](./doc/README-EN.md).

---

## Frontend

```bash
cp frontend/.env.example frontend/.env.local   # already points to devnet + Program ID
npm run dev:frontend     # http://localhost:3000
npm run test:frontend
npm run build:frontend
```

Variables (`frontend/.env.local`):

```env
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
# NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_ESCROW_PROGRAM_ID=2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS
```

Do not commit `.env.local` (it is listed in `.gitignore`).

### Using the UI

1. Open the app and connect a wallet (Phantom / Solflare) on **devnet**.
2. Create an offer (`MakeOffer`): mints A/B, amounts and a unique `seed`.
3. From another wallet (the maker cannot take their own offer): **Take** swaps Token B → Token A.
4. If nobody takes the offer, the **maker** can **Refund** and recover the tokens + rent.

You need ATAs funded with the mints you use (your own mints on localnet/devnet, or test tokens).

After a redeploy or a change to the instructions, sync the IDL:

```bash
npm run build:program
cp target/idl/escrow.json frontend/src/lib/idl/escrow.json
```

---

## Security (pre-deployment)

Applied checklist: [`doc/05-registro-ataques-EN.md`](./doc/05-registro-ataques-EN.md).

Summary: `transfer_checked` only, PDAs with seeds/bump, vault + state closed, tests for fake mint / non-maker refund / zero amounts.

```bash
npm run harden:check
npm run test:harden
```

---

## Structure

```
programs/escrow/     # Anchor program
tests/               # TS tests for the program
frontend/            # Next.js App Router
doc/                 # planning, diagrams, attacks, optimization
scripts/             # build-program.sh, harden-check.sh
```
