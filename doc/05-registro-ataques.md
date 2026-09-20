# Registro de ataques Solana — checklist pre-despliegue

Sí existen bibliotecas de ataques para Solana (el análogo de lo que en Ethereum suele verse vía SWC/Damn Vulnerable DeFi/Slither patterns). Lo que **no** había en este repo era un registro **aplicado a este escrow**. Este documento lo cubre.

## Fuentes canónicas del ecosistema (equivalente “biblioteca”)

| Recurso | Qué es | URL |
|---------|--------|-----|
| **Sealevel Attacks** (coral-xyz) | Repo oficial de exploits típicos de Solana + fixes Anchor (`insecure` / `secure` / `recommended`) | https://github.com/coral-xyz/sealevel-attacks |
| **Anchor — Security Exploits** | Índice en la docs de Anchor que apunta a Sealevel Attacks | https://www.anchor-lang.com/docs/references/security-exploits |
| **Solana Foundation — Program Security** | Curso: account data matching, PDA sharing, ownership, signer checks, etc. | https://github.com/solana-foundation/developer-content/tree/main/content/courses/program-security |
| **Neodyme / auditorías públicas** | Writeups de bugs reales en mainnet (referencia de severidad) | Buscar “Neodyme Solana security” |
| **Ackee Blockchain / OtterSec / Trail of Bits** | Guías y reportes de auditoría Solana/Anchor | Publicaciones de cada firma |

> En Ethereum el “catálogo” se popularizó como SWC + herramientas (Slither, Mythril). En Solana el catálogo de referencia práctica es **Sealevel Attacks** + el curso de Program Security de la Foundation.

Menciones locales:

- [`solana.cursorrules`](../solana.cursorrules) — Account Substitution, Missing Ownership Check
- [`.cursorrules`](../.cursorrules) — PDA, `transfer_checked`, close vault/state
- Tests: [`tests/escrow.ts`](../tests/escrow.ts)
- Script estático: `npm run harden:check`

---

## Matriz: ataque → riesgo en este escrow → estado

Leyenda: ✅ mitigado · 🟡 aceptado/documentado · ⬜ N/A · ❌ abierto

| # | Ataque (Sealevel / práctica) | Mitigación | Estado | Evidencia |
|---|------------------------------|------------|--------|-----------|
| 1 | **Account substitution** | `has_one` mints/maker, seeds, ATA | ✅ | TakeOffer mint falso |
| 2 | **Missing ownership check** | `Account` / `InterfaceAccount` | ✅ | Tipos Anchor |
| 3 | **Missing signer check** | `Signer` maker/taker/refund | ✅ | Refund no-maker |
| 4 | **PDA sharing / seeds débiles** | `[b"escrow", maker, seed]` | ✅ | `ESCROW_SEED` |
| 5 | **Arbitrary CPI / wrong program** | `TokenInterface` + `transfer_checked` | ✅ | Make/Take/Refund + `harden:check` |
| 6 | **Token decimals mismatch** | Solo `transfer_checked` | ✅ | `harden:check` |
| 7 | **Orphan lamports** | close vault + `close = maker` | ✅ | Take + Refund |
| 8 | **Re-initialization** | Sin `init_if_needed` | ✅ | `harden:check` |
| 9 | **Type cosplay** | Discriminator + owner | ✅ | `Account<EscrowState>` |
| 10 | **Integer overflow** | `overflow-checks = true` + `amount/receive > 0` | ✅ | Cargo.toml + tests amount/receive=0 |
| 11 | **Unauthorized refund** | maker signer + has_one + seeds | ✅ | Test Refund no-maker |
| 12 | **Account data matching** | vault authority = escrow PDA (`[b"vault", escrow]`) | ✅ | Make/Take/Refund |
| 13 | **Sysvar / clock spoofing** | No usamos clock | ⬜ | N/A |
| 14 | **Front-running** | Riesgo de mercado (1 PDA/seed); no es bug de ownership | 🟡 | Documentado: usar seeds únicos en UX |
| 15 | **Account duplication** | ATA con authorities distintas (maker/taker/vault) | ✅ | Constraints ATA; roles no solapables |

---

## Checklist pre-despliegue

### Validación de cuentas
- [x] Constraints explícitas (`seeds`, `bump`, `has_one`, ATA)
- [x] Sin `UncheckedAccount` sin constraint
- [x] Sin `.unwrap()` / `.expect()` en producción (`harden:check`)
- [x] Refund con las mismas reglas

### Tokens
- [x] Solo `transfer_checked`
- [x] `TokenInterface`
- [x] Vault authority = PDA
- [x] Cierre vault en Take + Refund

### PDAs / layout
- [x] Seeds documentadas
- [x] Bump persistido
- [x] Layout Borsh packed 121 bytes (`Pubkey`→`u64`→`u8`), little-endian
- [x] Espacio < 128 bytes

### Tests de ataque
- [x] MakeOffer amount = 0
- [x] MakeOffer receive = 0
- [x] MakeOffer mint_a == mint_b
- [x] TakeOffer mint A falso
- [x] Refund por no-maker
- [x] Layout on-chain byte offsets
- [x] Compute units MakeOffer < 100k (simulación)

### Build / deploy
- [x] `declare_id!` = keypair
- [x] `npm run harden:check` + `npm run test:harden`
- [x] Deploy a **devnet** (`2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS`)
- [ ] Deploy verifiable (opcional / mainnet)
- [x] IDL sincronizado con `frontend/src/lib/idl/escrow.json`
- [x] `Anchor.toml` `[programs.devnet]` + `.env.example` / `.env.local`

---

## Comandos

```bash
npm run harden:check    # estático: transfer_checked, no unwrap, overflow-checks
npm run test:layout     # Rust: INIT_SPACE + Borsh LE packed
npm run test:program    # build + suite TS
npm run test:harden     # los tres anteriores
```

---

## Persistencia de bytes (Solana SBF ≠ EVM)

| | Solana (este programa) | EVM / Solidity |
|--|------------------------|----------------|
| Modelo | Cuenta con blob Borsh | Storage slots 32 bytes |
| Padding | Packed, sin huecos entre campos | Slot packing / alignment distinto |
| Enteros | Little-endian | Big-endian en ABI |
| Orden óptimo aquí | `Pubkey(32)` → `u64(8)` → `u8(1)` | N/A (otro modelo) |

Offsets de `EscrowState` (con discriminator):

| Offset | Campo |
|-------:|-------|
| 0 | discriminator (8) |
| 8 | maker |
| 40 | mint_a |
| 72 | mint_b |
| 104 | receive (u64 LE) |
| 112 | seed (u64 LE) |
| 120 | bump |
| **121** | **total** |

---

## Mapa instrucción ↔ controles

| Instrucción | Controles clave |
|-------------|-----------------|
| `make_offer` | init PDA+vault, `transfer_checked`, amount/receive > 0, mints distintos |
| `take_offer` | has_one, PDA signer, close vault+state |
| `refund` | solo maker, close vault+state |
