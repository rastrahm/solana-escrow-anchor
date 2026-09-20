/// Prefijo de seeds para la PDA `EscrowState`.
///
/// Seeds completas: `[ESCROW_SEED, maker.key().as_ref(), seed.to_le_bytes().as_ref()]`
pub const ESCROW_SEED: &[u8] = b"escrow";

/// Prefijo de seeds para el vault (token account PDA, no ATA).
///
/// Seeds: `[VAULT_SEED, escrow.key().as_ref()]`
/// Evita CPI al Associated Token Program en `make_offer`.
pub const VAULT_SEED: &[u8] = b"vault";
