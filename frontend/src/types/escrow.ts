/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/escrow.json`.
 */
export type Escrow = {
  "address": "2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS",
  "metadata": {
    "name": "escrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "makeOffer",
      "docs": [
        "@notice Crea una oferta de escrow y deposita Token A en el vault PDA.",
        "@dev Ver `instructions::make_offer` para cuentas y validaciones.",
        "@param seed Seed u64 de la PDA (`[\"escrow\", maker, seed]`).",
        "@param receive Cantidad de Token B esperada del taker.",
        "@param amount Cantidad de Token A a bloquear en el vault.",
        "@return Result<()> Ok si la oferta quedó activa."
      ],
      "discriminator": [
        214,
        98,
        97,
        35,
        59,
        12,
        44,
        178
      ],
      "accounts": [
        {
          "name": "maker",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintA"
        },
        {
          "name": "mintB",
          "docs": [
            "Solo se persiste la pubkey; no hace falta deserializar el Mint completo."
          ]
        },
        {
          "name": "makerAtaA",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "maker"
              },
              {
                "kind": "arg",
                "path": "seed"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "receive",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "docs": [
        "@notice Cancela la oferta: el maker recupera Token A y el rent.",
        "@dev Solo el maker firmante; cierra vault + EscrowState.",
        "@return Result<()> Ok si la cancelación fue exitosa."
      ],
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "maker",
          "writable": true,
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "maker"
              },
              {
                "kind": "account",
                "path": "escrow.seed",
                "account": "escrowState"
              }
            ]
          }
        },
        {
          "name": "mintA",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "makerAtaA",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "takeOffer",
      "docs": [
        "@notice Acepta una oferta: swap atómico Token B → maker y Token A → taker.",
        "@dev Cierra vault y EscrowState; el rent vuelve al maker.",
        "@return Result<()> Ok si el swap y los cierres fueron exitosos."
      ],
      "discriminator": [
        128,
        156,
        242,
        207,
        237,
        192,
        103,
        240
      ],
      "accounts": [
        {
          "name": "taker",
          "writable": true,
          "signer": true
        },
        {
          "name": "maker",
          "docs": [
            "Maker recibe Token B y el rent de vault + EscrowState."
          ],
          "writable": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "maker"
              },
              {
                "kind": "account",
                "path": "escrow.seed",
                "account": "escrowState"
              }
            ]
          }
        },
        {
          "name": "mintA",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "mintB",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "takerAtaA",
          "writable": true
        },
        {
          "name": "takerAtaB",
          "writable": true
        },
        {
          "name": "makerAtaB",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "escrowState",
      "discriminator": [
        19,
        90,
        148,
        111,
        55,
        130,
        229,
        108
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Signer is not authorized for this escrow"
    },
    {
      "code": 6001,
      "name": "invalidMint",
      "msg": "Token mint does not match the escrow state"
    },
    {
      "code": 6002,
      "name": "invalidAmount",
      "msg": "Invalid token amount"
    },
    {
      "code": 6003,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "escrowState",
      "docs": [
        "Cuenta de estado del escrow (PDA).",
        "",
        "Seeds: `[b\"escrow\", maker.key().as_ref(), seed.to_le_bytes().as_ref()]`",
        "",
        "Authority del vault de Token A = esta PDA.",
        "Vault token account seeds: `[b\"vault\", escrow.key()]` (PDA, no ATA).",
        "",
        "# Layout de bytes (Borsh, sin padding entre campos)",
        "",
        "Orden **obligatorio** por tamaño descendente (`Pubkey` → `u64` → `u8`):",
        "",
        "| Offset | Campo     | Tipo     | Bytes |",
        "|-------:|-----------|----------|------:|",
        "| 0      | (disc.)   | `[u8; 8]`| 8     |",
        "| 8      | `maker`   | Pubkey   | 32    |",
        "| 40     | `mint_a`  | Pubkey   | 32    |",
        "| 72     | `mint_b`  | Pubkey   | 32    |",
        "| 104    | `receive` | u64      | 8     |",
        "| 112    | `seed`    | u64      | 8     |",
        "| 120    | `bump`    | u8       | 1     |",
        "| **121**| **total** |          |       |",
        "",
        "No usar `#[repr(C)]` / zero-copy aquí: el padding nativo (hasta múltiplo de 8)",
        "desalinearía `size_of` (120) vs Borsh (`INIT_SPACE` = 113).",
        "",
        "Persistencia: Solana/SBF usa **Borsh packed** (little-endian). No confundir con",
        "layout de storage EVM/Solidity (`slot` packing); aquí el orden descendente por",
        "tamaño evita padding si se migra a zero-copy y minimiza rent (< 128 bytes)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maker",
            "docs": [
              "Maker que creó la oferta y recibe el rent al cerrar. (offset 8, 32 bytes)"
            ],
            "type": "pubkey"
          },
          {
            "name": "mintA",
            "docs": [
              "Mint del token depositado en el vault — Token A. (offset 40, 32 bytes)"
            ],
            "type": "pubkey"
          },
          {
            "name": "mintB",
            "docs": [
              "Mint del token que el maker espera recibir — Token B. (offset 72, 32 bytes)"
            ],
            "type": "pubkey"
          },
          {
            "name": "receive",
            "docs": [
              "Cantidad de Token B que el taker debe pagar. (offset 104, 8 bytes)"
            ],
            "type": "u64"
          },
          {
            "name": "seed",
            "docs": [
              "Seed u64 de las PDA seeds (varios escrows por maker). (offset 112, 8 bytes)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump de la PDA `EscrowState`. (offset 120, 1 byte — siempre al final)"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
