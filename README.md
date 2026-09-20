# Solana Escrow (Anchor + Next.js)

Escrow atómico de tokens SPL (legacy + Token-2022) con programa Anchor y UI Next.js App Router.

**Program ID (localnet / devnet):** `2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS`

Explorador (devnet):  
https://explorer.solana.com/address/2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS?cluster=devnet

---

## Requisitos

- Node.js ≥ 20.18 (recomendado 22)
- Rust 1.75+
- Solana CLI 2.x
- Anchor CLI 0.31.x
- Wallet con SOL en **devnet** (faucet) para txs desde la UI

El build SBF usa platform-tools **v1.52** (`npm run build:program`) porque crates `edition2024` no compilán con v1.48 por defecto.

---

## Programa on-chain

```bash
# Build (.so + IDL)
npm run build:program

# Tests (localnet / bankrun vía Anchor)
npm run test:program

# Hardening: estático + layout + suite
npm run test:harden

# Deploy a devnet (usa ~/.config/solana/id.json)
anchor deploy --provider.cluster devnet
```

Instrucciones:

| Instrucción   | Quién  | Efecto |
|---------------|--------|--------|
| `make_offer`  | Maker  | Deposita Token A en vault PDA; crea `EscrowState` |
| `take_offer`  | Taker  | Paga Token B al maker; recibe Token A; cierra vault + state |
| `refund`      | Maker  | Cancela; recupera Token A + rent |

Seeds: `escrow` = `[b"escrow", maker, seed]`; vault = `[b"vault", escrow]`.

Documentación de diseño: [`doc/`](./doc/).

---

## Frontend

```bash
cp frontend/.env.example frontend/.env.local   # ya apunta a devnet + Program ID
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

No commitees `.env.local` (está en `.gitignore`).

### Uso de la UI

1. Abre la app y conecta una wallet (Phantom / Solflare) en **devnet**.
2. Crea una oferta (`MakeOffer`): mints A/B, amounts y `seed` único.
3. Desde otra wallet (o la misma si no eres el maker en take): **Take** intercambia Token B → Token A.
4. Si nadie toma la oferta, el **maker** puede **Refund** y recuperar tokens + rent.

Necesitas ATAs con saldo de los mints usados (mint propios en localnet/devnet o tokens de prueba).

Tras redeploy o cambio de instrucciones, sincroniza el IDL:

```bash
npm run build:program
cp target/idl/escrow.json frontend/src/lib/idl/escrow.json
```

---

## Seguridad (pre-despliegue)

Checklist aplicado: [`doc/05-registro-ataques.md`](./doc/05-registro-ataques.md).

Resumen: solo `transfer_checked`, PDAs con seeds/bump, cierre de vault + state, tests de mint falso / refund no-maker / amounts cero.

```bash
npm run harden:check
npm run test:harden
```

---

## Estructura

```
programs/escrow/     # programa Anchor
tests/               # tests TS del programa
frontend/            # Next.js App Router
doc/                 # planificación, diagramas, ataques, optimización
scripts/             # build-program.sh, harden-check.sh
```
