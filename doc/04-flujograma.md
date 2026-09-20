# Flujograma de procesos

Secuencias temporales (pasos ordenados) para cada instrucción y para el usuario en la dApp.

## 1. MakeOffer — secuencia on-chain

```mermaid
sequenceDiagram
    autonumber
    actor Maker
    participant UI as Frontend
    participant Prog as Escrow Program
    participant State as EscrowState PDA
    participant Vault as Vault ATA
    participant Token as Token Program

    Maker->>UI: Completa form (mints, amount, receive, seed)
    UI->>UI: Valida Zod
    UI->>Prog: make_offer(...)
    Prog->>State: init PDA seeds escrow+maker+seed
    Prog->>Vault: init ATA authority=State
    Prog->>Token: transfer_checked Maker ATA A → Vault
    Token-->>Vault: Token A depositados
    Prog-->>UI: Ok
    UI-->>Maker: Oferta visible / confirmación
```

## 2. TakeOffer — swap atómico

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

    Taker->>UI: Elige escrow activo
    UI->>Prog: take_offer
    Prog->>Prog: Validar mints, amounts, constraints
    Prog->>Token: transfer_checked Taker ATA B → Maker ATA B
    Token-->>Maker: Token B recibidos
    Prog->>Token: transfer_checked Vault → Taker ATA A (PDA signer)
    Token-->>Taker: Token A recibidos
    Prog->>Token: close_account Vault → Maker (rent)
    Prog->>State: close EscrowState → Maker (rent)
    Prog-->>UI: Ok
    UI-->>Taker: Swap confirmado
```

## 3. Refund — cancelación por maker

```mermaid
sequenceDiagram
    autonumber
    actor Maker
    participant UI as Frontend
    participant Prog as Escrow Program
    participant State as EscrowState PDA
    participant Vault as Vault ATA
    participant Token as Token Program

    Maker->>UI: Cancelar mi oferta
    UI->>UI: Comprobar wallet == maker
    UI->>Prog: refund
    Prog->>Prog: Validar signer == State.maker
    Prog->>Token: transfer_checked Vault → Maker ATA A (PDA signer)
    Token-->>Maker: Token A recuperados
    Prog->>Token: close_account Vault → Maker
    Prog->>State: close EscrowState → Maker
    Prog-->>UI: Ok
    UI-->>Maker: Oferta cerrada + rent
```

## 4. Flujograma UX de la dApp (swimlanes)

```mermaid
flowchart TB
    subgraph Usuario
        U1[Abrir dApp] --> U2[Conectar wallet]
        U2 --> U3{Acción}
        U3 -->|Crear| U4[Llenar MakeOffer]
        U3 -->|Tomar| U5[Elegir escrow]
        U3 -->|Cancelar| U6[Elegir escrow propio]
    end

    subgraph Frontend
        F1[Zod + tipado] --> F2[Armar accounts + args]
        F2 --> F3[Firmar y enviar tx]
        F3 --> F4[Refrescar lista / saldo]
        F5[error.tsx / toast error]
    end

    subgraph OnChain
        O1[Validar Accounts]
        O2[CPI transfer_checked]
        O3[Cerrar vault + state si aplica]
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

## 5. Matriz de cierre de cuentas

| Instrucción | Token A | Token B | Vault | EscrowState | Rent |
|-------------|---------|---------|-------|-------------|------|
| MakeOffer | Maker → Vault | — | init | init | Maker paga |
| TakeOffer | Vault → Taker | Taker → Maker | close | close → maker | Maker recupera |
| Refund | Vault → Maker | — | close | close → maker | Maker recupera |

## 6. Casos de prueba obligatorios (alineados a reglas)

```mermaid
flowchart LR
    subgraph Tests_Programa
        A[MakeOffer success]
        B[TakeOffer atomic swap]
        C[Refund success]
        D[Unauthorized refund]
        E[Fake mints]
        F[Space / layout]
    end

    subgraph Tests_Frontend
        G[Connect wallet UI]
        H[MakeOffer form Zod]
        I[Take / Refund buttons a11y]
        J[Server Action unit si aplica]
    end
```

Orden TDD: escribir el test de la columna correspondiente **antes** de la lógica Rust o del componente React.
