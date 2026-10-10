# Documentación — Solana Escrow Anchor

🇬🇧 [English version](./README-EN.md) · [Índice](./README.md)

Documentación de planificación y diseño para un escrow atómico de tokens SPL (legacy + Token-2022) con programa Anchor y frontend Next.js (App Router).

## Contenido

| Archivo | Descripción |
|---------|-------------|
| [01-planificacion-ES.md](./01-planificacion-ES.md) | Plan paso a paso (on-chain + frontend + tests) |
| [02-diagrama-flujo-ES.md](./02-diagrama-flujo-ES.md) | Diagrama de flujo del sistema y decisiones |
| [03-diagrama-clases-ES.md](./03-diagrama-clases-ES.md) | Diagrama de clases / estructura de cuentas y módulos |
| [04-flujograma-ES.md](./04-flujograma-ES.md) | Flujograma de instrucciones on-chain y UX |
| [05-registro-ataques-ES.md](./05-registro-ataques-ES.md) | Checklist Sealevel / seguridad pre-despliegue |
| [06-optimizacion-ES.md](./06-optimizacion-ES.md) | CU / rent / cuentas: análisis y cambios aplicados |

## Stack objetivo

- **On-chain:** Rust 1.75+, Anchor 0.30+, `anchor_spl::token_interface`
- **Tests programa:** TypeScript (`anchor test`) con TDD
- **Frontend:** Next.js App Router, Zod, Vitest + RTL, wallet adapter
- **Tokens:** SPL Token y Token-2022 vía `TokenInterface`

## Instrucciones del programa

1. **MakeOffer** — Maker deposita Token A en vault PDA
2. **TakeOffer** — Taker intercambia Token B por Token A (swap atómico)
3. **Refund** — Maker cancela y recupera Token A + rent
