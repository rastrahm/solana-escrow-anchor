# Optimización on-chain — CU, rent y tamaño de tx

Análisis de si el escrow puede ser más rápido/barato **sin debilitar seguridad**.

## Costes en Solana (qué optimizar)

| Dimensión | Qué paga el usuario | Palancas |
|-----------|---------------------|----------|
| **Rent** | Lamports bloqueados en cuentas | Menos bytes de estado |
| **CU** | Priority fee ≈ CU × precio | Menos CPI, menos deserialización, constraints más baratas |
| **Tx size** | Fee base + límites de cuentas | Menos cuentas por instrucción |

## Estado actual (ya bien)

| Ítem | Valor | Nota |
|------|------:|------|
| `EscrowState` | **121 bytes** | Bajo 128; Borsh packed; poco margen |
| Solo `transfer_checked` | sí | Correcto (seguridad > CU vs `transfer`) |
| `overflow-checks` | sí | Release |
| Cierre vault+state | sí | Recupera rent (lo más “económico” a medio plazo) |

**Conclusión rent/estado:** casi no hay ganancia real reduciendo más el state (ahorrar el `seed` u8/`bump` rompería PDAs o seguridad). Zero-copy no compensa en 121 bytes.

## Optimizaciones aplicables (seguras)

### 1. Vault como token account PDA (no ATA) — alto impacto
**Antes:** `init` vía Associated Token Program → cuenta extra + CPI ATA.  
**Después:** `token::` + seeds `[b"vault", escrow]` → **sin** `associated_token_program`.

Ahorro: 1 cuenta en MakeOffer + 1 CPI de creación ATA.

### 2. Constraints `token::` en vez de `associated_token::` — medio impacto
Validar mint/authority del token account **sin** recalcular la dirección ATA.

Ahorro CU en Make / Take / Refund; el cliente puede seguir usando ATAs.

### 3. `mint_b` en MakeOffer sin deserializar Mint completo — bajo/medio
Solo se guarda la pubkey. `UncheckedAccount` + `owner = token_program` evita parsear el mint.

### 4. Requires redundantes en TakeOffer — bajo
`receive > 0` ya se exige en MakeOffer. Quitar el check duplicado.

### 5. No recomendado (o trade-off fuerte)

| Idea | Por qué no |
|------|------------|
| `transfer` sin `_checked` | Ahorra poco CU; rompe la regla de seguridad del repo |
| Quitar mints del Take/Refund | `transfer_checked` **exige** la cuenta mint en el CPI |
| Batch Token CPI | Mejor CU en teoría; peor DX/compat Token-2022 hoy |
| Zero-copy state | Overhead > beneficio a 121 bytes |
| SPL Token only (sin Interface) | Menos CU posible; pierde Token-2022 |

## Front-running / “economía de mercado”
No es optimizable on-chain: es competencia de txs. Mitigación UX: seeds únicos, no reutilizar ofertas.

## Resultado tras aplicar 1–4

| Métrica | Antes | Después |
|---------|------:|--------:|
| Cuentas `make_offer` | 9 (incl. ATA program) | **8** |
| Cuentas `take_offer` | 10 | 10 |
| Cuentas `refund` | 6 | 6 |
| Suite tests | 14 | **14 verdes** |
| Estado on-chain | 121 bytes | 121 bytes (sin cambio) |
| CU simulados `make_offer` | (antes ~similar orden) | **~31 336 CU** (umbral test &lt; 80k) |

Cambios aplicados en código:
1. Vault PDA `[b"vault", escrow]` — sin Associated Token Program en MakeOffer.
2. Constraints `token::mint` / `token::authority` (sin derivar ATA).
3. `mint_b` como `UncheckedAccount` + `owner = token_program` en MakeOffer.
4. Eliminado `require!(receive > 0)` redundante en TakeOffer.

### Qué ya no conviene tocar
- Bajar de 121 bytes en state: rompería seeds/bump o seguridad.
- Quitar `transfer_checked` o mints del CPI: inseguro / imposible.
- Zero-copy / batch token: complejidad alta, ganancia dudosa aquí.

### Veredicto
El contrato **ya estaba cerca del óptimo** en rent. Las optimizaciones de esta pasada mejoran **coste de MakeOffer** (menos cuenta + sin CPI ATA) y **CU de validación** en las tres instrucciones, manteniendo la misma seguridad.