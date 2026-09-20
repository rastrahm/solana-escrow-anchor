use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    /// El firmante no es el maker del escrow (p. ej. refund no autorizado).
    #[msg("Signer is not authorized for this escrow")]
    Unauthorized,
    /// Mint pasado no coincide con el mint A/B guardado en el estado.
    #[msg("Token mint does not match the escrow state")]
    InvalidMint,
    /// Cantidad inválida (cero o distinta a la esperada).
    #[msg("Invalid token amount")]
    InvalidAmount,
    /// Overflow/underflow aritmético en montos.
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}
