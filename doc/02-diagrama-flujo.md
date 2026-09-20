# Diagrama de flujo del sistema

Vista de alto nivel: decisiones y caminos del escrow (on-chain + frontend).

## 1. Flujo general del producto

```mermaid
flowchart TD
    Start([Usuario abre la dApp]) --> Connect{¿Wallet conectada?}
    Connect -->|No| ConnectWallet[Conectar wallet]
    ConnectWallet --> Connect
    Connect -->|Sí| Role{¿Qué acción?}

    Role -->|Crear oferta| MakeUI[Formulario MakeOffer]
    Role -->|Aceptar oferta| TakeUI[Seleccionar escrow + TakeOffer]
    Role -->|Cancelar oferta| RefundUI[Seleccionar escrow propio + Refund]

    MakeUI --> ValidateMake{Zod + montos válidos?}
    ValidateMake -->|No| ErrMake[Mostrar error UI]
    ErrMake --> MakeUI
    ValidateMake -->|Sí| TxMake[Tx MakeOffer]
    TxMake --> OnMake{On-chain OK?}
    OnMake -->|No| ErrMake
    OnMake -->|Sí| DoneMake[Escrow activo + vault con Token A]

    TakeUI --> TxTake[Tx TakeOffer]
    TxTake --> OnTake{On-chain OK?}
    OnTake -->|No| ErrTake[Mostrar error UI]
    ErrTake --> TakeUI
    OnTake -->|Sí| DoneTake[Swap atómico + cuentas cerradas]

    RefundUI --> AuthRefund{¿Es el maker?}
    AuthRefund -->|No| ErrRefund[Rechazo UI / tx falla]
    AuthRefund -->|Sí| TxRefund[Tx Refund]
    TxRefund --> OnRefund{On-chain OK?}
    OnRefund -->|No| ErrRefund
    OnRefund -->|Sí| DoneRefund[Token A + rent al maker]

    DoneMake --> End([Estado actualizado en UI])
    DoneTake --> End
    DoneRefund --> End
```

## 2. Flujo de decisión on-chain (programa)

```mermaid
flowchart TD
    Ix([Instrucción recibida]) --> Which{¿Cuál?}

    Which -->|make_offer| M1[Validar Accounts MakeOffer]
    M1 --> M2[Init EscrowState PDA]
    M2 --> M3[Init Vault ATA authority=PDA]
    M3 --> M4[transfer_checked Maker → Vault Token A]
    M4 --> MOk([Ok - oferta abierta])

    Which -->|take_offer| T1[Validar Accounts TakeOffer]
    T1 --> T2{¿Mints y montos coinciden?}
    T2 -->|No| TErr([Error personalizado])
    T2 -->|Sí| T3[transfer_checked Taker → Maker Token B]
    T3 --> T4[transfer_checked Vault → Taker Token A con PDA signer]
    T4 --> T5[close_account Vault]
    T5 --> T6[close EscrowState → maker]
    T6 --> TOk([Ok - swap + rent reclaim])

    Which -->|refund| R1[Validar Accounts Refund]
    R1 --> R2{¿Signer == maker?}
    R2 -->|No| RErr([Error no autorizado])
    R2 -->|Sí| R3[transfer_checked Vault → Maker Token A con PDA signer]
    R3 --> R4[close_account Vault]
    R4 --> R5[close EscrowState → maker]
    R5 --> ROk([Ok - cancelación])
```

## 3. Flujo de datos frontend ↔ cadena

```mermaid
flowchart LR
    UI[Componentes React] --> Zod[Schemas Zod]
    Zod --> Hooks[Hooks / Program client]
    Hooks --> Adapter[Wallet Adapter]
    Adapter --> RPC[Solana RPC]
    RPC --> Program[Programa Escrow Anchor]
    Program --> PDA[EscrowState PDA]
    Program --> Vault[Vault Token Account]
    Program --> IDL[IDL tipado en frontend]
    IDL --> Hooks
```

## Notas de diseño

- Toda transferencia usa `transfer_checked` (decimals explícitos).
- El vault siempre tiene como authority el PDA `EscrowState`.
- TakeOffer y Refund cierran vault + estado y devuelven rent al maker.
- El frontend no asume cuentas: valida con Zod antes de armar la tx.
