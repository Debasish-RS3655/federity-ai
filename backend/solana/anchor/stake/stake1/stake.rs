// basic staking smart contract using anchor framework
// Debashish Buragohain

// import necessary modules and dependencies
use {
    anchor_lang::{prelude::*, solana_program::program::{invoke, invoke_signed}},
    spl_token::state,
}

// declare the unique id for the smart contract
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");


#[program]

pub mod basic_staking {
    use super::*;

    // initialize the smart contract
    pub fn initialize(ctx: Context<Intialize>) -> ProgramResult {
        Ok(())
    }


    // function to stake tokens
    pub fn stake(ctx: Context<Stake>, amount: u64) -> ProgramResult {
        // get mutable reference to the holder account
        let account = &mut ctx.accounts.holder;

        // clone the necessary account info for token transfer
        let token_program = ctx.accounts.token_program.clone();
        let source = ctx.accounts.stake_token.clone();
        let destination = ctx.accounts.stake_pot.clone();
        let authority = ctx.accounts.authority.clone();

        // invoke the token transfer from the user's account to the staking pool
        invoke(
            &spl_token::instruction::transfer(
                token_program.key,  // token program ID
                source.key,         // source account (user's token account)
                destination.key,    // destination account (staking pool)
                authority.key,      // Authority account (user's authority)
                &[],                // signers (none in this case)
                amount,             // amount of tokens to transfer
            )?,
            //accounts invoked in the transfer
            &[source, destination, authority, token_program]
        )

        // update the staking account with the new staked amount
        account.stake_amount += amount;

        // get the current timestamp
        let now_ts = Clock::get().unwrap().unix_.timestamp;

        // updtae the stake time
        account.stake_time = now_ts;


        Ok(())
    }

    // function to unstake token
    pub fn unstake(ctx: Context<Stake>, amount: u64) -> ProgramResult {
        // get mutable refernce to the holder account
        let account = &mut ctx.accounts.holder;

        // deduct the unstaked amount form the staking account
        account.stake_amount -= amount;

        let now_ts = Clock::get().unwrap().unix_timestamp;

        // update the stake time
        account.stake_time = now_ts;

        OK(());
    }


    // function to claim rewards
    pub fn claim(ctx: Context<Stake>) -> ProgramResult {
        // get mutable refernce to the holder account
        let account = &mut ctx.accounts.holder;

        // logic to transfer rewards tokens to the holder
        // 
        Ok();
    }
}


// defining the structure for initializing the contract
#[derive(Accounts)]
pub struct Initialize {}

// define the structure for setting authority
#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(mut, signer)]
    authority: AccountInfo<'info>,      // current authority account
    #[account(mut)]
    new_authority: AccountInfo<'info>,  // new authority account
    #[account(mut, owner = spl_token::id())]
    stake_pot: AccountInfo<'info>       // staking pool account
    #[account(address = spl_token::id())]
    token_program: AccountInfo<'info>   // token program account
}


// define the structure for staking
#[derive(Acounts)]
pub struct Stake<'info> {
    #[account(mut, signer)]
    authority: AccountInfo<'info>,              // autority account (user)
    #[account(mut, signer)]
    pub holder: Account<'info, StakeAccount>    // holder account (staker)
    #[account(mut, owner = spl_token::id())]
    stake_token: AccountInfo<'info>             // token account to stake from
    #[account(mut, owner = spl_token::id())]
    stake_pot: AccountInfo<'info>               // staking pool account
    #[account(address = spl_token::id())]
    token_program: AccountInfo<'info>           // token program account
}

// define the structure for the staking account
#[account]
pub struct StakeAccount {
    pub stake_amount: u64,  // amount of tokens staked
    pub stake_time: i64,    // Timestamp of when the tokens were staked
}