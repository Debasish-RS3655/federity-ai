use anchor_lang::prelude::*;                        // prelude includes commonly used items
use anhor_spl::token::{self, MintTo, Transfer};     // spl token library module for minting and transferring tokens
use anhor_spl::token_interface::{Mint, TokenAccount, TokenInterface};       // spl token interface module for token accounts


// the unique id for the smart contract, generated when the program is deployed
declare_id!("7MHr6ZPGTWZkRk6m52GfEWoMxSV7EoDjYyoXAYf3MBwS");


#[program]
pub mod solana_federated_staking {
    use super::*:

    // initialize the staking pool
    pub fn initialize(ctx: Context<Initialize>, start_slot: u64, end_slot: u64) -> Result<()> {
        msg!("Instruction: Initialize");                // log the instruction for debugging
        let pool_info = &mut ctx.accounts.pool_info;    // mutable reference to the pool_info account
        pool_info.admin = ctx.accounts.admin.key();     // set the admin key to the public key of the admin account
        // set the starting and ending slots for the staking period
        pool_info.start_slot = start_slot;
        pool_info.end_slot = end_slot;

        // set the token that will be used for staking
        pool_info.token = ctx.accounts.staking_token.key();
        Ok(());
    }

    // Function to stake tokens
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        // log the instruction for debugging process
        msg!("Instruction: Stake");

        // get a mutable reference to the user_info account to store the user's staking data
        let user_info = &mut ctx.accounts.user_info;
    }
}