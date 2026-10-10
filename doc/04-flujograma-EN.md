# Process flowchart

🇪🇸 [Versión en español](./04-flujograma-ES.md) · [Index](./README.md)

Time-ordered sequences (ordered steps) for each instruction and for the user in the dApp.

## 1. MakeOffer — on-chain sequence

```mermaid
sequenceDiagram
    autonumber
    actor Maker
    participant UI as Frontend
    participant Prog as Escrow Program
    participant State as EscrowState PDA
    participant Vault as Vault ATA
    participant Token as Token Program

    Maker->>UI: Fills in form (mints, amount, receive, seed)
    UI->>UI: Validates with Zod
    UI->>Prog: make_offer(...)
    Prog->>State: init PDA seeds escrow+maker+seed
    Prog->>Vault: init ATA authority=State
    Prog->>Token: transfer_checked Maker ATA A → Vault
    Token-->>Vault: Token A deposited
    Prog-->>UI: Ok
    UI-->>Maker: Offer visible / confirmation
```

## 2. TakeOffer — atomic swap

```mermaid
sequenceDiagram
    autonumber
    actor Taker
    participant UI as Frontend
    participant Prog as Escrow Program
    participant State as EscrowState PDA
    participant Vault as Vault ATA
    participant Token as Token Program
    actor Maker

    Taker->>UI: Picks an active escrow
    UI->>Prog: take_offer
    Prog->>Prog: Validate mints, amounts, constraints
    Prog->>Token: transfer_checked Taker ATA B → Maker ATA B
    Token-->>Maker: Token B received
    Prog->>Token: transfer_checked Vault → Taker ATA A (PDA signer)
    Token-->>Taker: Token A received
    Prog->>Token: close_account Vault → Maker (rent)
    Prog->>State: close EscrowState → Maker (rent)
    Prog-->>UI: Ok
    UI-->>Taker: Swap confirmed
```

## 3. Refund — cancellation by the maker

```mermaid
sequenceDiagram
    autonumber
    actor Maker
    participant UI as Frontend
    participant Prog as Escrow Program
    participant State as EscrowState PDA
    participant Vault as Vault ATA
    participant Token as Token Program

    Maker->>UI: Cancel my offer
    UI->>UI: Check wallet == maker
    UI->>Prog: refund
    Prog->>Prog: Validate signer == State.maker
    Prog->>Token: transfer_checked Vault → Maker ATA A (PDA signer)
    Token-->>Maker: Token A recovered
    Prog->>Token: close_account Vault → Maker
    Prog->>State: close EscrowState → Maker
    Prog-->>UI: Ok
    UI-->>Maker: Offer closed + rent
```

## 4. dApp UX flowchart (swimlanes)

```mermaid
flowchart TB
    subgraph User
        U1[Open dApp] --> U2[Connect wallet]
        U2 --> U3{Action}
        U3 -->|Create| U4[Fill in MakeOffer]
        U3 -->|Take| U5[Pick escrow]
        U3 -->|Cancel| U6[Pick own escrow]
    end

    subgraph Frontend
        F1[Zod + typing] --> F2[Build accounts + args]
        F2 --> F3[Sign and send tx]
        F3 --> F4[Refresh list / balance]
        F5[error.tsx / error toast]
    end

    subgraph OnChain
        O1[Validate accounts]
        O2[CPI transfer_checked]
        O3[Close vault + state if applicable]
    end

    U4 --> F1
    U5 --> F1
    U6 --> F1
    F3 --> O1
    O1 --> O2
    O2 --> O3
    O3 -->|Ok| F4
    O1 -->|Error| F5
    O2 -->|Error| F5
```

## 5. Account closing matrix

| Instruction | Token A | Token B | Vault | EscrowState | Rent |
|-------------|---------|---------|-------|-------------|------|
| MakeOffer | Maker → Vault | — | init | init | Maker pays |
| TakeOffer | Vault → Taker | Taker → Maker | close | close → maker | Maker recovers |
| Refund | Vault → Maker | — | close | close → maker | Maker recovers |

## 6. Mandatory test cases (aligned with the rules)

```mermaid
flowchart LR
    subgraph Program_Tests
        A[MakeOffer success]
        B[TakeOffer atomic swap]
        C[Refund success]
        D[Unauthorized refund]
        E[Fake mints]
        F[Space / layout]
    end

    subgraph Frontend_Tests
        G[Connect wallet UI]
        H[MakeOffer form Zod]
        I[Take / Refund buttons a11y]
        J[Server Action unit if applicable]
    end
```

TDD order: write the test in the matching column **before** the Rust logic or the React component.
