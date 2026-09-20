pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("2nak96ykerNBL3DkTcWoUKPgiENtLBS8ij9LhyPGXrAS");

#[program]
pub mod escrow {
    use super::*;

    /// @notice Crea una oferta de escrow y deposita Token A en el vault PDA.
    /// @dev Ver `instructions::make_offer` para cuentas y validaciones.
    /// @param seed Seed u64 de la PDA (`["escrow", maker, seed]`).
    /// @param receive Cantidad de Token B esperada del taker.
    /// @param amount Cantidad de Token A a bloquear en el vault.
    /// @return Result<()> Ok si la oferta quedó activa.
    pub fn make_offer(
        ctx: Context<MakeOffer>,
        seed: u64,
        receive: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::make_offer::make_offer(ctx, seed, receive, amount)
    }

    /// @notice Acepta una oferta: swap atómico Token B → maker y Token A → taker.
    /// @dev Cierra vault y EscrowState; el rent vuelve al maker.
    /// @return Result<()> Ok si el swap y los cierres fueron exitosos.
    pub fn take_offer(ctx: Context<TakeOffer>) -> Result<()> {
        instructions::take_offer::take_offer(ctx)
    }
}

#[cfg(test)]
mod layout_tests {
    use super::EscrowState;
    use anchor_lang::Space;

    /// 3×Pubkey(32) + 2×u64(8) + u8(1) = 113
    const EXPECTED_INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 1;

    #[test]
    fn escrow_state_init_space_matches_field_sizes() {
        assert_eq!(EscrowState::INIT_SPACE, EXPECTED_INIT_SPACE);
    }

    #[test]
    fn escrow_state_total_space_includes_discriminator() {
        assert_eq!(EscrowState::SPACE, 8 + EXPECTED_INIT_SPACE);
        assert_eq!(EscrowState::SPACE, 121);
    }

    #[test]
    fn escrow_state_stays_under_128_bytes() {
        assert!(
            EscrowState::SPACE < 128,
            "EscrowState::SPACE={} must stay under 128 for rent minimization",
            EscrowState::SPACE
        );
    }

    #[test]
    fn escrow_seed_prefix_is_escrow() {
        assert_eq!(EscrowState::SEED_PREFIX, b"escrow");
    }

    /// Guarda el orden optimizado: bloques grandes primero, `bump` al final.
    #[test]
    fn field_offsets_are_packed_descending_by_size() {
        assert_eq!(EscrowState::OFF_MAKER, 8);
        assert_eq!(EscrowState::OFF_MINT_A, EscrowState::OFF_MAKER + 32);
        assert_eq!(EscrowState::OFF_MINT_B, EscrowState::OFF_MINT_A + 32);
        assert_eq!(EscrowState::OFF_RECEIVE, EscrowState::OFF_MINT_B + 32);
        assert_eq!(EscrowState::OFF_SEED, EscrowState::OFF_RECEIVE + 8);
        assert_eq!(EscrowState::OFF_BUMP, EscrowState::OFF_SEED + 8);
        assert_eq!(EscrowState::OFF_BUMP + 1, EscrowState::SPACE);

        let packed = 8 + 32 + 32 + 32 + 8 + 8 + 1;
        assert_eq!(packed, EscrowState::SPACE);
    }

    #[test]
    fn pubkeys_precede_u64s_precede_u8() {
        assert!(EscrowState::OFF_MAKER < EscrowState::OFF_MINT_A);
        assert!(EscrowState::OFF_MINT_A < EscrowState::OFF_MINT_B);
        assert!(EscrowState::OFF_MINT_B < EscrowState::OFF_RECEIVE);
        assert!(EscrowState::OFF_RECEIVE < EscrowState::OFF_SEED);
        assert!(EscrowState::OFF_SEED < EscrowState::OFF_BUMP);
        assert_eq!(EscrowState::OFF_BUMP, EscrowState::SPACE - 1);
    }
}
