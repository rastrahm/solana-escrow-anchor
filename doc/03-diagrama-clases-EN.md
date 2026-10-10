# Class diagram / structure

🇪🇸 [Versión en español](./03-diagrama-clases-ES.md) · [Index](./README.md)

On-chain account model, program modules and frontend layers. Solana has no classic OOP: the "classes" here represent accounts, contexts and TypeScript interfaces.

## 1. On-chain (Anchor program)

```mermaid
classDiagram
    direction TB

    class EscrowProgram {
        +make_offer(ctx, seed, receive, amount)
        +take_offer(ctx)
        +refund(ctx)
    }

    class EscrowState {
        +Pubkey maker
        +Pubkey mint_a
        +Pubkey mint_b
        +u64 receive
        +u64 seed
        +u8 bump
        --
        seeds: ["escrow", maker, seed]
        space: 8 + INIT_SPACE
    }

    class MakeOffer {
        +Signer maker
        +EscrowState escrow
        +TokenAccount vault
        +Mint mint_a
        +Mint mint_b
        +TokenAccount maker_ata_a
        +TokenInterface token_program
        +SystemProgram system_program
    }

    class TakeOffer {
        +Signer taker
        +EscrowState escrow
        +TokenAccount vault
        +Mint mint_a
        +Mint mint_b
        +TokenAccount taker_ata_a
        +TokenAccount taker_ata_b
        +TokenAccount maker_ata_b
        +TokenInterface token_program
    }

    class Refund {
        +Signer maker
        +EscrowState escrow
        +TokenAccount vault
        +Mint mint_a
        +TokenAccount maker_ata_a
        +TokenInterface token_program
    }

    class EscrowError {
        <<enumeration>>
        Unauthorized
        InvalidMint
        InvalidAmount
        ArithmeticOverflow
    }

    EscrowProgram --> MakeOffer : Context
    EscrowProgram --> TakeOffer : Context
    EscrowProgram --> Refund : Context
    MakeOffer --> EscrowState : init
    TakeOffer --> EscrowState : close to maker
    Refund --> EscrowState : close to maker
    EscrowState --> EscrowError : may throw
    MakeOffer ..> EscrowError
    TakeOffer ..> EscrowError
    Refund ..> EscrowError
```

### `EscrowState` layout (ordered by size)

| Field | Type | Bytes |
|-------|------|-------|
| discriminator | — | 8 |
| maker | Pubkey | 32 |
| mint_a | Pubkey | 32 |
| mint_b | Pubkey | 32 |
| receive | u64 | 8 |
| seed | u64 | 8 |
| bump | u8 | 1 |
| **Approx. total** | | **~121** |

Goal: keep the state **under 128 bytes** to minimize rent.

---

## 2. Frontend (Next.js App Router)

```mermaid
classDiagram
    direction TB

    class WalletProvider {
        +children
        +connects cluster and wallets
    }

    class EscrowProgramClient {
        +Program program
        +makeOffer(params)
        +takeOffer(escrowPda)
        +refund(escrowPda)
        +fetchEscrows(filters)
    }

    class MakeOfferSchema {
        <<Zod>>
        +mintA: PublicKey
        +mintB: PublicKey
        +amountA: u64
        +receiveB: u64
        +seed: u64
    }

    class MakeOfferForm {
        +onSubmit()
        +validates with Zod
    }

    class EscrowList {
        +escrows: EscrowView[]
        +onTake()
        +onRefund()
    }

    class EscrowView {
        +publicKey: PublicKey
        +maker: PublicKey
        +mintA: PublicKey
        +mintB: PublicKey
        +receive: BN
        +seed: BN
    }

    class TakeOfferButton {
        +escrow: EscrowView
        +runs take_offer
    }

    class RefundButton {
        +escrow: EscrowView
        +only if wallet == maker
    }

    class useEscrow {
        +escrows
        +loading
        +error
        +refresh()
        +makeOffer()
        +takeOffer()
        +refund()
    }

    WalletProvider --> EscrowProgramClient : injects connection/wallet
    useEscrow --> EscrowProgramClient
    MakeOfferForm --> MakeOfferSchema
    MakeOfferForm --> useEscrow
    EscrowList --> EscrowView
    EscrowList --> TakeOfferButton
    EscrowList --> RefundButton
    TakeOfferButton --> useEscrow
    RefundButton --> useEscrow
    EscrowProgramClient --> EscrowView : deserializes accounts
```

---

## 3. Vault ↔ PDA relationship

```mermaid
classDiagram
    direction LR

    class EscrowStatePDA {
        seeds escrow + maker + seed
        bump stored
    }

    class VaultTokenAccount {
        mint: mint_a
        authority: EscrowState PDA
        amount: deposit Token A
    }

    EscrowStatePDA <|-- VaultTokenAccount : authority
```

The vault authority is **never** the maker or the taker: only the PDA can sign withdrawals via `signer_seeds`.
