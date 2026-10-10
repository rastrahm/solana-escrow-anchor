# Documentation — Solana Escrow Anchor

🇪🇸 [Versión en español](./README-ES.md) · [Index](./README.md)

Planning and design documentation for an atomic SPL token escrow (legacy + Token-2022) with an Anchor program and a Next.js (App Router) frontend.

## Contents

| File | Description |
|------|-------------|
| [01-planificacion-EN.md](./01-planificacion-EN.md) | Step-by-step plan (on-chain + frontend + tests) |
| [02-diagrama-flujo-EN.md](./02-diagrama-flujo-EN.md) | System flow diagram and decisions |
| [03-diagrama-clases-EN.md](./03-diagrama-clases-EN.md) | Class diagram / account and module structure |
| [04-flujograma-EN.md](./04-flujograma-EN.md) | Process flowchart for on-chain instructions and UX |
| [05-registro-ataques-EN.md](./05-registro-ataques-EN.md) | Sealevel checklist / pre-deployment security |
| [06-optimizacion-EN.md](./06-optimizacion-EN.md) | CU / rent / accounts: analysis and applied changes |

## Target stack

- **On-chain:** Rust 1.75+, Anchor 0.30+, `anchor_spl::token_interface`
- **Program tests:** TypeScript (`anchor test`) with TDD
- **Frontend:** Next.js App Router, Zod, Vitest + RTL, wallet adapter
- **Tokens:** SPL Token and Token-2022 via `TokenInterface`

## Program instructions

1. **MakeOffer** — Maker deposits Token A into the vault PDA
2. **TakeOffer** — Taker swaps Token B for Token A (atomic swap)
3. **Refund** — Maker cancels and recovers Token A + rent
