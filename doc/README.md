# Documentación — Solana Escrow Anchor

Documentación de planificación y diseño para un escrow atómico de tokens SPL (legacy + Token-2022) con programa Anchor y frontend Next.js (App Router).

## Contenido

| Archivo | Descripción |
|---------|-------------|
| [01-planificacion.md](./01-planificacion.md) | Plan paso a paso (on-chain + frontend + tests) |
| [02-diagrama-flujo.md](./02-diagrama-flujo.md) | Diagrama de flujo del sistema y decisiones |
| [03-diagrama-clases.md](./03-diagrama-clases.md) | Diagrama de clases / estructura de cuentas y módulos |
| [04-flujograma.md](./04-flujograma.md) | Flujograma de instrucciones on-chain y UX |
| [06-optimizacion.md](./06-optimizacion.md) | CU / rent / cuentas: análisis y cambios aplicados |

## Stack objetivo

- **On-chain:** Rust 1.75+, Anchor 0.30+, `anchor_spl::token_interface`
- **Tests programa:** TypeScript (`anchor test`) con TDD
- **Frontend:** Next.js App Router, Zod, Vitest + RTL, wallet adapter
- **Tokens:** SPL Token y Token-2022 vía `TokenInterface`

## Instrucciones del programa

1. **MakeOffer** — Maker deposita Token A en vault PDA
2. **TakeOffer** — Taker intercambia Token B por Token A (swap atómico)
3. **Refund** — Maker cancela y recupera Token A + rent
