# Planificación paso a paso — Escrow SPL + Frontend

Guía ordenada para construir el proyecto desde cero. Cada fase asume TDD: tests primero, implementación después.

## Progreso

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Setup del monorepo | ✅ Completada |
| 1 | Modelo de estado on-chain | ✅ Completada |
| 2 | MakeOffer (TDD) | ✅ Completada |
| 3 | TakeOffer (swap atómico) | ✅ Completada |
| 4 | Refund | ✅ Completada |
| 5 | Hardening on-chain | ⬜ Pendiente |
| 6 | Frontend: base Next.js | ⬜ Pendiente |
| 7 | Frontend: features (TDD UI) | ⬜ Pendiente |
| 8 | Integración y despliegue | ⬜ Pendiente |

---

## Fase 0 — Setup del monorepo ✅

> **Estado: completada** (rama `bootstrap`).

- [x] Inicializar git (si aún no existe) y confirmar `.gitignore` en la raíz.
- [x] Crear workspace Anchor en la raíz (`programs/`, `tests/`, `Anchor.toml`, `Cargo.toml`).
- [x] Crear app frontend Next.js en `frontend/` (App Router + Tailwind + `src/`).
- [x] Alinear versiones:
  - **Node ≥ 20.18** (usar `nvm use` + `.nvmrc` → 22.22.2)
  - **Anchor 0.31.1** / Solana CLI 2.2.x
  - **platform-tools v1.52** para compilar (ver abajo)
- [x] Verificar `declare_id!` == pubkey del keypair en `target/deploy/` (ignorado por git).
- [x] Criterio de salida: `npm run build:program` y `npm run build:frontend` sin errores.

### Compilación del programa

Solana 2.2.x trae platform-tools **v1.48** (cargo 1.84), incompatible con crates `edition2024`. Usar el script del repo:

```bash
npm run build:program    # cargo-build-sbf --tools-version v1.52 + IDL
npm run build:frontend   # next build
npm run dev:frontend     # next dev
```

---

## Fase 1 — Modelo de estado on-chain ✅

> **Estado: completada.**

- [x] Definir `EscrowState` con `#[account]` + `#[derive(InitSpace)]`.
- [x] Ordenar campos por tamaño descendente (`Pubkey` → `u64` → `u8`):
  - `maker`, `mint_a`, `mint_b`
  - `receive` (cantidad Token B esperada)
  - `seed`, `bump`
- [x] Calcular espacio: `EscrowState::SPACE = 8 + INIT_SPACE` = **121** (< 128).
- [x] Documentar seeds: `[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()]` (`ESCROW_SEED`).
- [x] Definir `EscrowError`: `Unauthorized`, `InvalidMint`, `InvalidAmount`, `ArithmeticOverflow`.
- [x] Criterio de salida: tests de layout en verde.

```bash
npm run test:layout     # Rust: INIT_SPACE / SPACE / seed
npm run test:program    # build + tests TS (IDL errors + space)
```

---

## Fase 2 — MakeOffer (TDD) ✅

> **Estado: completada.**

- [x] Test primero: maker crea escrow, vault recibe Token A, estado correcto.
- [x] Implementar `make_offer`:
  - `init` de `EscrowState` (payer = maker)
  - `init` vault ATA con authority = PDA escrow
  - CPI `transfer_checked` maker → vault
- [x] Constraints explícitas: `seeds`, `bump`, `token_program` vía `TokenInterface`.
- [x] Documentar instrucción (notice / accounts / return).
- [x] Criterio de salida: tests MakeOffer en verde (`npm run test:program`).

```bash
npm run test:program
```

---

## Fase 3 — TakeOffer (swap atómico) ✅

> **Estado: completada.**

- [x] Test primero: taker paga Token B; recibe Token A; vault/escrow cierran; rent al maker.
- [x] Implementar:
  - Taker → Maker: `transfer_checked` (Token B)
  - Vault → Taker: `transfer_checked` con PDA signer
  - `close_account` del vault + `close = maker` en EscrowState
- [x] Test mint falso (account substitution) → falla.
- [x] Criterio de salida: `npm run test:program` (8 tests) en verde.

---

## Fase 4 — Refund ✅

> **Estado: completada.**

- [x] Test primero: solo maker cancela; recupera Token A + rent.
- [x] Implementar refund: PDA signer + `close_account` vault + `close = maker`.
- [x] Test de ataque: no-maker intenta refund → error.
- [x] Criterio de salida: `npm run test:program` (10 tests) en verde.

---

## Fase 5 — Hardening on-chain

1. Revisar ownership, signers, account substitution (usar [05-registro-ataques.md](./05-registro-ataques.md)).
2. Confirmar siempre `transfer_checked` (decimals).
3. Medir compute units; ajustar si hace falta.
4. Benchmark de espacio sin padding excesivo.
5. Completar checklist pre-despliegue del registro de ataques.
6. `anchor test` / `npm run test:program` completo en localnet.

**Criterio de salida:** suite 100% verde + checklist pre-despliegue sin ❌ abiertos.

---

## Fase 6 — Frontend: base Next.js

1. Estructura App Router: `layout`, `page`, `error.tsx`, `not-found.tsx`.
2. Dependencias: `@solana/wallet-adapter-*`, `@coral-xyz/anchor`, Zod.
3. Provider de wallet + conexión a cluster (devnet/localnet).
4. Tipado estricto: cero `any`; interfaces exportadas.
5. Declarar `'use client'` / `'use server'` de forma explícita.
6. Configurar Vitest + React Testing Library.

**Criterio de salida:** app muestra estado de wallet conectada/desconectada.

---

## Fase 7 — Frontend: features (TDD UI)

Orden sugerido (test de interacción → componente):

| Feature | Qué hace el usuario |
|---------|---------------------|
| ConnectWallet | Conectar / desconectar wallet |
| MakeOfferForm | Elegir mints, montos, seed → envía MakeOffer |
| EscrowList | Listar escrows activos (RPC / accounts) |
| TakeOfferButton | Aceptar oferta (swap) |
| RefundButton | Cancelar oferta propia |

1. Validar formularios y params con Zod.
2. Componentes ≤ ~60 líneas; extraer subcomponentes.
3. JSDoc en cada componente, hook y Server Action.
4. Manejo de errores de tx visibles y accesibles (roles ARIA).

**Criterio de salida:** flujo E2E manual en localnet: make → take y make → refund.

---

## Fase 8 — Integración y despliegue

1. Desplegar programa a devnet; actualizar IDL e ID en frontend.
2. Variables de entorno (`.env.local`, nunca commitear secretos).
3. Checklist de seguridad (ver `solana.cursorrules` + `.cursorrules`).
4. README de usuario: cómo build, test y usar la UI.

**Criterio de salida:** demo funcional en devnet.

---

## Estructura de carpetas objetivo

```
solana-escrow-anchor/
├── .cursorrules
├── nextjs.cursorrules
├── solana.cursorrules
├── .gitignore
├── Anchor.toml
├── Cargo.toml
├── doc/                    # esta documentación
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
├── target/                 # build (ignorado)
└── frontend/               # Next.js App Router
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── hooks/
    │   ├── lib/            # IDL, program client, Zod schemas
    │   └── actions/        # Server Actions si aplica
    └── ...
```

---

## Orden de trabajo recomendado (resumen)

```
Setup → State → MakeOffer → TakeOffer → Refund → Hardening
                                                      ↓
                                              Frontend base
                                                      ↓
                                         Make / List / Take / Refund UI
                                                      ↓
                                              Devnet + docs usuario
```
