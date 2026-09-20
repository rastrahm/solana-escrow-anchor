use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
    },
};

use crate::{constants::ESCROW_SEED, error::EscrowError, state::EscrowState};

/// @notice Crea una oferta de escrow: inicializa el estado PDA, el vault ATA
///         (authority = PDA) y deposita `amount` de Token A con `transfer_checked`.
/// @param ctx Cuentas: maker, mints A/B, maker_ata_a, escrow, vault, programs.
/// @param seed Identificador u64 embebido en las seeds de la PDA.
/// @param receive Cantidad de Token B que el maker espera del taker.
/// @param amount Cantidad de Token A a depositar en el vault.
/// @return Result<()> Ok si el estado y el depósito se completaron.
pub fn make_offer(
    ctx: Context<MakeOffer>,
    seed: u64,
    receive: u64,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);
    require!(receive > 0, EscrowError::InvalidAmount);
    require!(
        ctx.accounts.mint_a.key() != ctx.accounts.mint_b.key(),
        EscrowError::InvalidMint
    );

    ctx.accounts.escrow.set_inner(EscrowState {
        maker: ctx.accounts.maker.key(),
        mint_a: ctx.accounts.mint_a.key(),
        mint_b: ctx.accounts.mint_b.key(),
        receive,
        seed,
        bump: ctx.bumps.escrow,
    });

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.maker_ata_a.to_account_info(),
                mint: ctx.accounts.mint_a.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.maker.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.mint_a.decimals,
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        space = EscrowState::SPACE,
        seeds = [ESCROW_SEED, maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowState>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
