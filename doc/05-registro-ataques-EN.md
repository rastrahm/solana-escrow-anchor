# Solana attack registry — pre-deployment checklist

🇪🇸 [Versión en español](./05-registro-ataques-ES.md) · [Index](./README.md)

Attack libraries do exist for Solana (the counterpart of what Ethereum usually covers through SWC / Damn Vulnerable DeFi / Slither patterns). What this repo **did not** have was a registry **applied to this escrow**. This document covers it.

## Canonical ecosystem sources (the "library" equivalent)

| Resource | What it is | URL |
|----------|------------|-----|
| **Sealevel Attacks** (coral-xyz) | Official repo of typical Solana exploits + Anchor fixes (`insecure` / `secure` / `recommended`) | https://github.com/coral-xyz/sealevel-attacks |
| **Anchor — Security Exploits** | Index in the Anchor docs pointing to Sealevel Attacks | https://www.anchor-lang.com/docs/references/security-exploits |
| **Solana Foundation — Program Security** | Course: account data matching, PDA sharing, ownership, signer checks, etc. | https://github.com/solana-foundation/developer-content/tree/main/content/courses/program-security |
| **Neodyme / public audits** | Writeups of real mainnet bugs (severity reference) | Search "Neodyme Solana security" |
| **Ackee Blockchain / OtterSec / Trail of Bits** | Solana/Anchor audit guides and reports | Each firm's publications |

> In Ethereum the "catalog" became popular as SWC + tools (Slither, Mythril). In Solana the practical reference catalog is **Sealevel Attacks** + the Foundation's Program Security course.

Local references:

- [`solana.cursorrules`](../solana.cursorrules) — Account Substitution, Missing Ownership Check
- [`.cursorrules`](../.cursorrules) — PDA, `transfer_checked`, close vault/state
- Tests: [`tests/escrow.ts`](../tests/escrow.ts)
- Static script: `npm run harden:check`

---

## Matrix: attack → risk in this escrow → status

Legend: ✅ mitigated · 🟡 accepted/documented · ⬜ N/A · ❌ open

| # | Attack (Sealevel / practice) | Mitigation | Status | Evidence |
|---|------------------------------|------------|--------|----------|
| 1 | **Account substitution** | `has_one` mints/maker, seeds, ATA | ✅ | TakeOffer fake mint |
| 2 | **Missing ownership check** | `Account` / `InterfaceAccount` | ✅ | Anchor types |
| 3 | **Missing signer check** | `Signer` maker/taker/refund | ✅ | Non-maker refund |
| 4 | **PDA sharing / weak seeds** | `[b"escrow", maker, seed]` | ✅ | `ESCROW_SEED` |
| 5 | **Arbitrary CPI / wrong program** | `TokenInterface` + `transfer_checked` | ✅ | Make/Take/Refund + `harden:check` |
| 6 | **Token decimals mismatch** | `transfer_checked` only | ✅ | `harden:check` |
| 7 | **Orphan lamports** | close vault + `close = maker` | ✅ | Take + Refund |
| 8 | **Re-initialization** | No `init_if_needed` | ✅ | `harden:check` |
| 9 | **Type cosplay** | Discriminator + owner | ✅ | `Account<EscrowState>` |
| 10 | **Integer overflow** | `overflow-checks = true` + `amount/receive > 0` | ✅ | Cargo.toml + amount/receive=0 tests |
| 11 | **Unauthorized refund** | maker signer + has_one + seeds | ✅ | Non-maker Refund test |
| 12 | **Account data matching** | vault authority = escrow PDA (`[b"vault", escrow]`) | ✅ | Make/Take/Refund |
| 13 | **Sysvar / clock spoofing** | We do not use the clock | ⬜ | N/A |
| 14 | **Front-running** | Market risk (1 PDA/seed); not an ownership bug | 🟡 | Documented: use unique seeds in the UX |
| 15 | **Account duplication** | ATAs with distinct authorities (maker/taker/vault) | ✅ | ATA constraints; roles cannot overlap |

---

## Pre-deployment checklist

### Account validation
- [x] Explicit constraints (`seeds`, `bump`, `has_one`, ATA)
- [x] No `UncheckedAccount` without a constraint
- [x] No `.unwrap()` / `.expect()` in production code (`harden:check`)
- [x] Refund follows the same rules

### Tokens
- [x] `transfer_checked` only
- [x] `TokenInterface`
- [x] Vault authority = PDA
- [x] Vault closed on Take + Refund

### PDAs / layout
- [x] Seeds documented
- [x] Bump persisted
- [x] Borsh packed layout of 121 bytes (`Pubkey`→`u64`→`u8`), little-endian
- [x] Space < 128 bytes

### Attack tests
- [x] MakeOffer amount = 0
- [x] MakeOffer receive = 0
- [x] MakeOffer mint_a == mint_b
- [x] TakeOffer fake mint A
- [x] Refund by a non-maker
- [x] On-chain layout byte offsets
- [x] MakeOffer compute units < 100k (simulation)

### Build / deploy
- [x] `declare_id!` = keypair
- [x] `npm run harden:check` + `npm run test:harden`
- [x] Deployed to **devnet** (`2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS`)
- [ ] Verifiable deploy (optional / mainnet)
- [x] IDL synced with `frontend/src/lib/idl/escrow.json`
- [x] `Anchor.toml` `[programs.devnet]` + `.env.example` / `.env.local`

---

## Commands

```bash
npm run harden:check    # static: transfer_checked, no unwrap, overflow-checks
npm run test:layout     # Rust: INIT_SPACE + Borsh LE packed
npm run test:program    # build + TS suite
npm run test:harden     # all three above
```

---

## Byte persistence (Solana SBF ≠ EVM)

| | Solana (this program) | EVM / Solidity |
|--|-----------------------|----------------|
| Model | Account holding a Borsh blob | 32-byte storage slots |
| Padding | Packed, no gaps between fields | Different slot packing / alignment |
| Integers | Little-endian | Big-endian in the ABI |
| Optimal order here | `Pubkey(32)` → `u64(8)` → `u8(1)` | N/A (different model) |

`EscrowState` offsets (including discriminator):

| Offset | Field |
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

## Instruction ↔ controls map

| Instruction | Key controls |
|-------------|--------------|
| `make_offer` | init PDA+vault, `transfer_checked`, amount/receive > 0, distinct mints |
| `take_offer` | has_one, PDA signer, close vault+state |
| `refund` | maker only, close vault+state |
