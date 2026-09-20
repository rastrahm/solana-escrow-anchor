use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::{constants::ESCROW_SEED, error::EscrowError, state::EscrowState};

/// @notice Cancela una oferta activa: el maker recupera Token A del vault y el rent.
/// @dev Solo el maker (signer + `has_one`) puede invocar. Cierra vault y EscrowState.
/// @param ctx Cuentas: maker, escrow, mint_a, vault, maker_ata_a, token_program.
/// @return Result<()> Ok si tokens y rent volvieron al maker.
pub fn refund(ctx: Context<Refund>) -> Result<()> {
    let seed = ctx.accounts.escrow.seed;
    let bump = ctx.accounts.escrow.bump;
    let maker_key = ctx.accounts.escrow.maker;
    let amount_a = ctx.accounts.vault.amount;

    require!(amount_a > 0, EscrowError::InvalidAmount);

    let seed_bytes = seed.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[
        ESCROW_SEED,
        maker_key.as_ref(),
        seed_bytes.as_ref(),
        &[bump],
    ]];

    // Vault → Maker: Token A (PDA signer)
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint_a.to_account_info(),
                to: ctx.accounts.maker_ata_a.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
        amount_a,
        ctx.accounts.mint_a.decimals,
    )?;

    // Cerrar vault → rent al maker
    close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.vault.to_account_info(),
            destination: ctx.accounts.maker.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        },
        signer_seeds,
    ))?;

    Ok(())
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mut,
        close = maker,
        seeds = [ESCROW_SEED, maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = maker @ EscrowError::Unauthorized,
        has_one = mint_a @ EscrowError::InvalidMint
    )]
    pub escrow: Box<Account<'info, EscrowState>>,

    pub mint_a: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = escrow,
        associated_token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub maker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}
