use anchor_lang::prelude::*;
use anchor_lang::Space;

/// Cuenta de estado del escrow (PDA).
///
/// Seeds: `[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()]`
///
/// Authority del vault de Token A = esta PDA.
///
/// # Layout de bytes (Borsh, sin padding entre campos)
///
/// Orden **obligatorio** por tamaño descendente (`Pubkey` → `u64` → `u8`):
///
/// | Offset | Campo     | Tipo     | Bytes |
/// |-------:|-----------|----------|------:|
/// | 0      | (disc.)   | `[u8; 8]`| 8     |
/// | 8      | `maker`   | Pubkey   | 32    |
/// | 40     | `mint_a`  | Pubkey   | 32    |
/// | 72     | `mint_b`  | Pubkey   | 32    |
/// | 104    | `receive` | u64      | 8     |
/// | 112    | `seed`    | u64      | 8     |
/// | 120    | `bump`    | u8       | 1     |
/// | **121**| **total** |          |       |
///
/// No usar `#[repr(C)]` / zero-copy aquí: el padding nativo (hasta múltiplo de 8)
/// desalinearía `size_of` (120) vs Borsh (`INIT_SPACE` = 113).
#[account]
#[derive(InitSpace)]
pub struct EscrowState {
    /// Maker que creó la oferta y recibe el rent al cerrar. (offset 8, 32 bytes)
    pub maker: Pubkey,
    /// Mint del token depositado en el vault — Token A. (offset 40, 32 bytes)
    pub mint_a: Pubkey,
    /// Mint del token que el maker espera recibir — Token B. (offset 72, 32 bytes)
    pub mint_b: Pubkey,
    /// Cantidad de Token B que el taker debe pagar. (offset 104, 8 bytes)
    pub receive: u64,
    /// Seed u64 de las PDA seeds (varios escrows por maker). (offset 112, 8 bytes)
    pub seed: u64,
    /// Bump de la PDA `EscrowState`. (offset 120, 1 byte — siempre al final)
    pub bump: u8,
}

impl EscrowState {
    /// Discriminator Anchor (8) + datos (`INIT_SPACE`).
    pub const SPACE: usize = 8 + Self::INIT_SPACE;

    /// Prefijo de seed de la PDA (debe coincidir con constraints on-chain).
    pub const SEED_PREFIX: &'static [u8] = crate::constants::ESCROW_SEED;

    // --- Offsets absolutos en la cuenta (incluye discriminator) ---
    pub const OFF_MAKER: usize = 8;
    pub const OFF_MINT_A: usize = 40;
    pub const OFF_MINT_B: usize = 72;
    pub const OFF_RECEIVE: usize = 104;
    pub const OFF_SEED: usize = 112;
    pub const OFF_BUMP: usize = 120;
}
