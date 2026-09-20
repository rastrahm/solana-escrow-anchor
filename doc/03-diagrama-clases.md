# Diagrama de clases / estructura

Modelo de cuentas on-chain, módulos del programa y capas del frontend. En Solana no hay OOP clásica: las “clases” representan cuentas, contextos e interfaces TypeScript.

## 1. On-chain (programa Anchor)

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
    EscrowState --> EscrowError : puede lanzar
    MakeOffer ..> EscrowError
    TakeOffer ..> EscrowError
    Refund ..> EscrowError
```

### Layout de `EscrowState` (orden por tamaño)

| Campo | Tipo | Bytes |
|-------|------|-------|
| discriminator | — | 8 |
| maker | Pubkey | 32 |
| mint_a | Pubkey | 32 |
| mint_b | Pubkey | 32 |
| receive | u64 | 8 |
| seed | u64 | 8 |
| bump | u8 | 1 |
| **Total aprox.** | | **~121** |

Objetivo: mantener el estado **bajo 128 bytes** para minimizar rent.

---

## 2. Frontend (Next.js App Router)

```mermaid
classDiagram
    direction TB

    class WalletProvider {
        +children
        +conecta cluster y wallets
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
        +valida con Zod
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
        +ejecuta take_offer
    }

    class RefundButton {
        +escrow: EscrowView
        +solo si wallet == maker
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

    WalletProvider --> EscrowProgramClient : inyecta connection/wallet
    useEscrow --> EscrowProgramClient
    MakeOfferForm --> MakeOfferSchema
    MakeOfferForm --> useEscrow
    EscrowList --> EscrowView
    EscrowList --> TakeOfferButton
    EscrowList --> RefundButton
    TakeOfferButton --> useEscrow
    RefundButton --> useEscrow
    EscrowProgramClient --> EscrowView : deserializa cuentas
```

---

## 3. Relación vault ↔ PDA

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

La authority del vault **nunca** es el maker ni el taker: solo el PDA puede firmar retiros vía `signer_seeds`.
