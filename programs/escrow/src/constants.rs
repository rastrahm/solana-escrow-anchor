/// Prefijo de seeds para la PDA `EscrowState`.
///
/// Seeds completas: `[ESCROW_SEED, maker.key().as_ref(), seed.to_le_bytes().as_ref()]`
pub const ESCROW_SEED: &[u8] = b"escrow";
