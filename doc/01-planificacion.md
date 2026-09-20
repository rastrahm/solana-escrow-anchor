# Planificación paso a paso — Escrow SPL + Frontend

Guía ordenada para construir el proyecto desde cero. Cada fase asume TDD: tests primero, implementación después.

---

## Fase 0 — Setup del monorepo

1. Inicializar git (si aún no existe) y confirmar `.gitignore` en la raíz.
2. Crear workspace Anchor en la raíz:
   ```bash
   anchor init escrow --no-git
   ```
   (o reorganizar carpetas `programs/`, `tests/`, `Anchor.toml`, `Cargo.toml`).
3. Crear app frontend Next.js en `app/` o `frontend/`:
   ```bash
   npx create-next-app@latest frontend --typescript --app --eslint --tailwind --src-dir
   ```
4. Alinear versiones: Anchor ≥ 0.30, Solana CLI, Node LTS.
5. Verificar `declare_id!` y keypair de despliegue (`target/deploy/*.json` en `.gitignore`).

**Criterio de salida:** `anchor build` y `frontend` arrancan sin errores.

---

## Fase 1 — Modelo de estado on-chain

1. Definir `EscrowState` con `#[account]` + `#[derive(InitSpace)]`.
2. Ordenar campos por tamaño descendente (`Pubkey` → `u64` → `u8`):
   - `maker`, `mint_a`, `mint_b`
   - `receive` (cantidad Token B esperada)
   - `seed`, `bump`
3. Calcular espacio: `8 + EscrowState::INIT_SPACE` (< 128 bytes objetivo).
4. Documentar seeds: `[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()]`.
5. Definir `#[error_code]` personalizados (sin `.unwrap()` / `.expect()`).

**Criterio de salida:** test de espacio/layout que valide discriminator + bytes.

---

## Fase 2 — MakeOffer (TDD)

1. **Test primero:** maker crea escrow, vault recibe Token A, estado correcto.
2. Implementar instrucción `make_offer`:
   - `init` de `EscrowState` (payer = maker)
   - `init` vault ATA con authority = PDA escrow
   - CPI `transfer_checked` maker → vault
3. Constraints explícitas: `seeds`, `bump`, `token_program` vía `TokenInterface`.
4. Documentar instrucción (notice / accounts / return).

**Criterio de salida:** test MakeOffer en verde.

---

## Fase 3 — TakeOffer (swap atómico)

1. **Test primero:** taker paga Token B al maker; recibe Token A; vault y escrow se cierran; rent al maker.
2. Implementar:
   - Taker → Maker: `transfer_checked` (Token B)
   - Vault → Taker: `transfer_checked` con `CpiContext::new_with_signer`
   - `close_account` del vault (CPI con signer seeds)
   - `close = maker` en `EscrowState`
3. Test de mints falsos / cuentas no autorizadas (debe fallar).

**Criterio de salida:** swap atómico + cierre de cuentas verificados.

---

## Fase 4 — Refund

1. **Test primero:** solo maker cancela; recupera Token A + rent.
2. Implementar refund con PDA signer + `close_account` vault + `close = maker`.
3. Test de ataque: no-maker intenta refund → error.

**Criterio de salida:** refund + unauthorized attack en verde.

---

## Fase 5 — Hardening on-chain

1. Revisar ownership, signers, account substitution.
2. Confirmar siempre `transfer_checked` (decimals).
3. Medir compute units; ajustar si hace falta.
4. Benchmark de espacio sin padding excesivo.
5. `anchor test` completo en localnet.

**Criterio de salida:** suite de tests del programa 100% verde.

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
