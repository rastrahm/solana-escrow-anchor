# On-chain optimization — CU, rent and transaction size

🇪🇸 [Versión en español](./06-optimizacion-ES.md) · [Index](./README.md)

Analysis of whether the escrow can be made faster/cheaper **without weakening security**.

## Costs on Solana (what to optimize)

| Dimension | What the user pays | Levers |
|-----------|--------------------|--------|
| **Rent** | Lamports locked in accounts | Fewer state bytes |
| **CU** | Priority fee ≈ CU × price | Fewer CPIs, less deserialization, cheaper constraints |
| **Tx size** | Base fee + account limits | Fewer accounts per instruction |

## Current state (already good)

| Item | Value | Note |
|------|------:|------|
| `EscrowState` | **121 bytes** | Under 128; Borsh packed; little headroom |
| `transfer_checked` only | yes | Correct (security > CU vs `transfer`) |
| `overflow-checks` | yes | Release |
| Vault + state closing | yes | Recovers rent (the most "economical" lever in the medium term) |

**Rent/state conclusion:** there is almost no real gain in shrinking the state further (dropping the `seed` u8/`bump` would break PDAs or security). Zero-copy is not worth it at 121 bytes.

## Applicable (safe) optimizations

### 1. Vault as a PDA token account (not an ATA) — high impact
**Before:** `init` via the Associated Token Program → extra account + ATA CPI.  
**After:** `token::` + seeds `[b"vault", escrow]` → **no** `associated_token_program`.

Savings: 1 account in MakeOffer + 1 ATA creation CPI.

### 2. `token::` constraints instead of `associated_token::` — medium impact
Validate the token account's mint/authority **without** recomputing the ATA address.

CU savings in Make / Take / Refund; the client can keep using ATAs.

### 3. `mint_b` in MakeOffer without deserializing the full Mint — low/medium
Only the pubkey is stored. `UncheckedAccount` + `owner = token_program` avoids parsing the mint.

### 4. Redundant requires in TakeOffer — low
`receive > 0` is already enforced in MakeOffer. Remove the duplicated check.

### 5. Not recommended (or strong trade-off)

| Idea | Why not |
|------|---------|
| `transfer` without `_checked` | Saves little CU; breaks the repo's security rule |
| Remove mints from Take/Refund | `transfer_checked` **requires** the mint account in the CPI |
| Batch Token CPI | Better CU in theory; worse DX/Token-2022 compatibility today |
| Zero-copy state | Overhead > benefit at 121 bytes |
| SPL Token only (no Interface) | Lowest possible CU; loses Token-2022 |

## Front-running / "market economics"
Not optimizable on-chain: it is transaction competition. UX mitigation: unique seeds, do not reuse offers.

## Result after applying 1–4

| Metric | Before | After |
|--------|-------:|------:|
| `make_offer` accounts | 9 (incl. ATA program) | **8** |
| `take_offer` accounts | 10 | 10 |
| `refund` accounts | 6 | 6 |
| Test suite | 14 | **14 passing** |
| On-chain state | 121 bytes | 121 bytes (unchanged) |
| Simulated `make_offer` CU | (similar order before) | **~31,336 CU** (test threshold &lt; 80k) |

Changes applied in code:
1. Vault PDA `[b"vault", escrow]` — no Associated Token Program in MakeOffer.
2. `token::mint` / `token::authority` constraints (no ATA derivation).
3. `mint_b` as `UncheckedAccount` + `owner = token_program` in MakeOffer.
4. Removed the redundant `require!(receive > 0)` in TakeOffer.

### What is no longer worth touching
- Going below 121 bytes of state: would break seeds/bump or security.
- Removing `transfer_checked` or mints from the CPI: unsafe / impossible.
- Zero-copy / batch token: high complexity, doubtful gain here.

### Verdict
The contract **was already close to optimal** on rent. The optimizations in this pass improve **MakeOffer cost** (one fewer account + no ATA CPI) and **validation CU** in all three instructions, while keeping the same security.
