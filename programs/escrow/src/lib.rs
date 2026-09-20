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

    /// @notice Cancela la oferta: el maker recupera Token A y el rent.
    /// @dev Solo el maker firmante; cierra vault + EscrowState.
    /// @return Result<()> Ok si la cancelación fue exitosa.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        instructions::refund::refund(ctx)
    }
}

#[cfg(test)]
mod layout_tests {
    use super::EscrowState;
    use anchor_lang::prelude::Pubkey;
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

    /// Persistencia on-chain (Borsh / SBF): packed, little-endian, sin padding.
    /// Nota: esto NO es layout EVM/Solidity; Solana serializa con Borsh.
    #[test]
    fn borsh_persistence_is_packed_little_endian_descending() {
        use anchor_lang::AnchorSerialize;

        let maker = Pubkey::new_from_array([0x11; 32]);
        let mint_a = Pubkey::new_from_array([0x22; 32]);
        let mint_b = Pubkey::new_from_array([0x33; 32]);
        let receive: u64 = 0x0102_0304_0506_0708;
        let seed: u64 = 0xA0B0_C0D0_E0F0_0011;
        let bump: u8 = 255;

        let state = EscrowState {
            maker,
            mint_a,
            mint_b,
            receive,
            seed,
            bump,
        };

        let buf = state.try_to_vec().expect("serialize EscrowState");
        assert_eq!(buf.len(), EscrowState::INIT_SPACE);

        // Offsets relativos al payload (sin discriminator de cuenta)
        assert_eq!(&buf[0..32], maker.as_ref());
        assert_eq!(&buf[32..64], mint_a.as_ref());
        assert_eq!(&buf[64..96], mint_b.as_ref());
        assert_eq!(&buf[96..104], &receive.to_le_bytes());
        assert_eq!(&buf[104..112], &seed.to_le_bytes());
        assert_eq!(buf[112], bump);

        // Sin bytes de relleno: longitud exacta = suma de campos
        assert_eq!(buf.len(), 32 + 32 + 32 + 8 + 8 + 1);
    }
}
