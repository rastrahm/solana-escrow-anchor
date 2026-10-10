# System flow diagram

🇪🇸 [Versión en español](./02-diagrama-flujo-ES.md) · [Index](./README.md)

High-level view: decisions and paths of the escrow (on-chain + frontend).

## 1. General product flow

```mermaid
flowchart TD
    Start([User opens the dApp]) --> Connect{Wallet connected?}
    Connect -->|No| ConnectWallet[Connect wallet]
    ConnectWallet --> Connect
    Connect -->|Yes| Role{Which action?}

    Role -->|Create offer| MakeUI[MakeOffer form]
    Role -->|Accept offer| TakeUI[Select escrow + TakeOffer]
    Role -->|Cancel offer| RefundUI[Select own escrow + Refund]

    MakeUI --> ValidateMake{Zod + valid amounts?}
    ValidateMake -->|No| ErrMake[Show UI error]
    ErrMake --> MakeUI
    ValidateMake -->|Yes| TxMake[MakeOffer tx]
    TxMake --> OnMake{On-chain OK?}
    OnMake -->|No| ErrMake
    OnMake -->|Yes| DoneMake[Active escrow + vault holding Token A]

    TakeUI --> TxTake[TakeOffer tx]
    TxTake --> OnTake{On-chain OK?}
    OnTake -->|No| ErrTake[Show UI error]
    ErrTake --> TakeUI
    OnTake -->|Yes| DoneTake[Atomic swap + accounts closed]

    RefundUI --> AuthRefund{Is the maker?}
    AuthRefund -->|No| ErrRefund[UI rejection / tx fails]
    AuthRefund -->|Yes| TxRefund[Refund tx]
    TxRefund --> OnRefund{On-chain OK?}
    OnRefund -->|No| ErrRefund
    OnRefund -->|Yes| DoneRefund[Token A + rent back to maker]

    DoneMake --> End([State updated in UI])
    DoneTake --> End
    DoneRefund --> End
```

## 2. On-chain decision flow (program)

```mermaid
flowchart TD
    Ix([Instruction received]) --> Which{Which one?}

    Which -->|make_offer| M1[Validate MakeOffer accounts]
    M1 --> M2[Init EscrowState PDA]
    M2 --> M3[Init vault ATA authority=PDA]
    M3 --> M4[transfer_checked Maker → Vault Token A]
    M4 --> MOk([Ok - offer open])

    Which -->|take_offer| T1[Validate TakeOffer accounts]
    T1 --> T2{Mints and amounts match?}
    T2 -->|No| TErr([Custom error])
    T2 -->|Yes| T3[transfer_checked Taker → Maker Token B]
    T3 --> T4[transfer_checked Vault → Taker Token A with PDA signer]
    T4 --> T5[close_account Vault]
    T5 --> T6[close EscrowState → maker]
    T6 --> TOk([Ok - swap + rent reclaim])

    Which -->|refund| R1[Validate Refund accounts]
    R1 --> R2{Signer == maker?}
    R2 -->|No| RErr([Unauthorized error])
    R2 -->|Yes| R3[transfer_checked Vault → Maker Token A with PDA signer]
    R3 --> R4[close_account Vault]
    R4 --> R5[close EscrowState → maker]
    R5 --> ROk([Ok - cancellation])
```

## 3. Frontend ↔ chain data flow

```mermaid
flowchart LR
    UI[React components] --> Zod[Zod schemas]
    Zod --> Hooks[Hooks / Program client]
    Hooks --> Adapter[Wallet Adapter]
    Adapter --> RPC[Solana RPC]
    RPC --> Program[Anchor Escrow program]
    Program --> PDA[EscrowState PDA]
    Program --> Vault[Vault token account]
    Program --> IDL[Typed IDL in frontend]
    IDL --> Hooks
```

## Design notes

- Every transfer uses `transfer_checked` (explicit decimals).
- The vault authority is always the `EscrowState` PDA.
- TakeOffer and Refund close vault + state and return rent to the maker.
- The frontend does not assume accounts: it validates with Zod before building the transaction.
