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

> En Ethereum el “catálogo” se popularizó como SWC + herramientas (Slither, Mythril). En Solana el catálogo de referencia práctica es **Sealevel Attacks** + el curso de Program Security de la Foundation. No hay (aún) un estándar único tipo SWC con IDs universales igual de adoptado, pero el contenido sí existe.

Menciones locales previas (sin checklist formal):

- [`solana.cursorrules`](../solana.cursorrules) — Account Substitution, Missing Ownership Check, ownership, signers, PDAs
- [`.cursorrules`](../.cursorrules) — mitigaciones del escrow (PDA, `transfer_checked`, close vault/state)
- Tests en [`tests/escrow.ts`](../tests/escrow.ts) — mint falso, amount=0

---

## Matriz: ataque → riesgo en este escrow → estado

Leyenda: ✅ mitigado · 🟡 parcial / pendiente de test · ⬜ no aplica aún · ❌ abierto

| # | Ataque (Sealevel / práctica) | Cómo se manifiesta | Mitigación en este programa | Estado | Evidencia |
|---|------------------------------|--------------------|-----------------------------|--------|-----------|
| 1 | **Account substitution** | Pasar otra cuenta válida del mismo tipo (p. ej. mint falso) | `has_one = mint_a/mint_b/maker`, seeds PDA, `associated_token::*` | ✅ | Test TakeOffer mint falso |
| 2 | **Missing ownership check** | Usar cuenta no owned por el programa esperado | `Account<>` / `InterfaceAccount<>` validan owner + discriminator | ✅ | Tipos Anchor en Make/Take |
| 3 | **Missing signer check** | Ejecutar sin la firma correcta | `Signer` en maker/taker; refund exigirá maker | 🟡 | Take OK; Refund Fase 4 |
| 4 | **PDA sharing / seeds débiles** | Misma PDA para contextos distintos → drenaje | Seeds `[b"escrow", maker, seed]` por oferta | ✅ | `ESCROW_SEED` + bump guardado |
| 5 | **Arbitrary CPI / wrong program** | CPI a programa token incorrecto | `Interface<'info, TokenInterface>` + `transfer_checked` | ✅ | Make/Take |
| 6 | **Token amount / decimals mismatch** | `transfer` sin decimals → spoofing | Solo `transfer_checked` | ✅ | Regla `.cursorrules` |
| 7 | **Closing account / orphan lamports** | Vault o state quedan abiertos con rent | `close_account` vault + `close = maker` en state | 🟡 | Take cierra ambos; Refund Fase 4 |
| 8 | **Re-initialization (`init_if_needed`)** | Reabrir cuenta cerrada con datos maliciosos | No usamos `init_if_needed`; solo `init` | ✅ | MakeOffer |
| 9 | **Type cosplay** | Cuenta con layout parecido / discriminator engañoso | Discriminator Anchor + owner check | ✅ | `Account<EscrowState>` |
| 10 | **Integer overflow** | Montos wrap-around | `u64` + `require!(amount/receive > 0)`; perfil `overflow-checks` | 🟡 | Checks básicos; ampliar tests Fase 5 |
| 11 | **Unauthorized refund** | No-maker cancela y roba Token A | Pendiente: `has_one = maker` + signer maker | ⬜ | Fase 4 |
| 12 | **Account data matching** | Authority del vault ≠ PDA escrow | Vault ATA `authority = escrow` | ✅ | MakeOffer + Take constraints |
| 13 | **Sysvar / clock spoofing** | No usamos clock/sysvar custom | N/A | ⬜ | — |
| 14 | **Front-running / tx ordering** | Taker compite por la misma oferta | Riesgo de mercado (una PDA por seed); no es bug de ownership | 🟡 | Documentar UX; seeds únicos |
| 15 | **Writable/account duplication** | Misma cuenta dos veces en roles conflictivos | Constraints ATA distintas (maker/taker/vault) | 🟡 | Revisar en hardening |

---

## Checklist pre-despliegue (usar antes de devnet/mainnet)

### Validación de cuentas
- [x] Toda cuenta en `#[derive(Accounts)]` con constraints explícitas (`seeds`, `bump`, `has_one`, ATA)
- [x] Sin `UncheckedAccount` sin `constraint` documentada (maker en Take es `SystemAccount` + `has_one`)
- [x] Sin `.unwrap()` / `.expect()` en lógica on-chain
- [ ] Revisar Refund con las mismas reglas (Fase 4)

### Tokens
- [x] Solo `transfer_checked`
- [x] `TokenInterface` (SPL + Token-2022)
- [x] Vault authority = PDA escrow
- [x] Cierre de vault en TakeOffer
- [ ] Cierre de vault en Refund

### PDAs
- [x] Seeds documentadas y estables
- [x] Bump persistido en estado y reutilizado (`bump = escrow.bump`)
- [x] No compartir PDA entre makers/ofertas

### Tests de ataque obligatorios
- [x] MakeOffer amount = 0
- [x] TakeOffer mint A falso
- [ ] Refund por no-maker
- [ ] Overflow / receive = 0 en Take (si aplica)
- [ ] Espacio de cuenta = 121 bytes en init

### Build / deploy
- [x] `declare_id!` = keypair de deploy
- [ ] `npm run build:program` limpio en CI
- [ ] Deploy verifiable (opcional Anchor `--verifiable`)
- [ ] IDL tipado sincronizado con frontend

---

## Cómo usar Sealevel Attacks al auditar este repo

1. Clonar o abrir https://github.com/coral-xyz/sealevel-attacks  
2. Para cada carpeta de ataque, leer `insecure` vs `recommended`.  
3. Buscar el mismo patrón en `programs/escrow/src/instructions/*.rs`.  
4. Marcar la fila de la matriz arriba como ✅ / 🟡 / ❌.  
5. Si falta cobertura: añadir test en `tests/escrow.ts` **antes** del fix (TDD).

Comandos locales:

```bash
npm run test:program    # suite actual (incl. mint falso)
npm run test:layout     # layout EscrowState
```

---

## Mapa rápido instrucción ↔ controles

| Instrucción | Controles clave |
|-------------|-----------------|
| `make_offer` | `init` PDA + vault ATA, `transfer_checked`, amount/receive > 0, mints distintos |
| `take_offer` | `has_one` maker/mints, PDA seeds+bump, CPI signer, close vault+state |
| `refund` (pendiente) | Solo maker signer + `has_one`, mismo cierre vault/state |

---

## Próximos pasos (Fase 4–5)

1. Implementar `refund` + test unauthorized.  
2. Completar filas 🟡/⬜ de la matriz.  
3. Opcional: script CI que falle si `grep` detecta `transfer(` sin `_checked` o `init_if_needed`.  
4. Antes de mainnet: pasar la checklist completa y, idealmente, revisión externa usando Sealevel Attacks + curso Program Security.
