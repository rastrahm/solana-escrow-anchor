use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
    TransferChecked,
};

use crate::{
    constants::{ESCROW_SEED, VAULT_SEED},
    error::EscrowError,
    state::EscrowState,
};

/// @notice Swap atómico: el taker paga Token B al maker y recibe Token A del vault.
/// @dev Cierra vault (CPI PDA signer) y `EscrowState` (`close = maker`) para recuperar rent.
/// @return Result<()> Ok si el swap y el cierre de cuentas fueron exitosos.
pub fn take_offer(ctx: Context<TakeOffer>) -> Result<()> {
    let seed = ctx.accounts.escrow.seed;
    let bump = ctx.accounts.escrow.bump;
    let maker_key = ctx.accounts.escrow.maker;
    let receive = ctx.accounts.escrow.receive;
    let amount_a = ctx.accounts.vault.amount;

    // receive > 0 ya se validó en make_offer; amount_a protege vault vacío anómalo.
    require!(amount_a > 0, EscrowError::InvalidAmount);

    // 1) Taker → Maker: Token B
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.taker_ata_b.to_account_info(),
                mint: ctx.accounts.mint_b.to_account_info(),
                to: ctx.accounts.maker_ata_b.to_account_info(),
                authority: ctx.accounts.taker.to_account_info(),
            },
        ),
        receive,
        ctx.accounts.mint_b.decimals,
    )?;

    let seed_bytes = seed.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[
        ESCROW_SEED,
        maker_key.as_ref(),
        seed_bytes.as_ref(),
        &[bump],
    ]];

    // 2) Vault → Taker: Token A (PDA signer)
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint_a.to_account_info(),
                to: ctx.accounts.taker_ata_a.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        ),
        amount_a,
        ctx.accounts.mint_a.decimals,
    )?;

    // 3) Cerrar vault → rent al maker
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
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    /// Maker recibe Token B y el rent de vault + EscrowState.
    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
        mut,
        close = maker,
        seeds = [ESCROW_SEED, maker.key().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump = escrow.bump,
        has_one = maker @ EscrowError::Unauthorized,
        has_one = mint_a @ EscrowError::InvalidMint,
        has_one = mint_b @ EscrowError::InvalidMint
    )]
    pub escrow: Box<Account<'info, EscrowState>>,

    pub mint_a: Box<InterfaceAccount<'info, Mint>>,
    pub mint_b: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        seeds = [VAULT_SEED, escrow.key().as_ref()],
        bump,
        token::mint = mint_a,
        token::authority = escrow,
        token::token_program = token_program
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = mint_a,
        token::authority = taker,
        token::token_program = token_program
    )]
    pub taker_ata_a: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = mint_b,
        token::authority = taker,
        token::token_program = token_program
    )]
    pub taker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = mint_b,
        token::authority = maker,
        token::token_program = token_program
    )]
    pub maker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}
