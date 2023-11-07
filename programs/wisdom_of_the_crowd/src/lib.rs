use anchor_lang::prelude::*;
use crate::instructions::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("F4R832vNyeoCnxFAEwVkhRcapXiA3CsAyRvmwWHEByTt");

#[program]
pub mod wisdom_of_the_crowd {

    use super::*;

    pub fn initialize(
        ctx: Context<InitializeQuestion>,
        question: String,
        treshol: u32,
    ) -> Result<()> {
        initialize_question(ctx, question, treshol)
    }

    pub fn create_answer(ctx: Context<AddAnswer>, answer: u64) -> Result<()> {
        add_answer(ctx, answer)
    }

    pub fn change_answer(ctx: Context<UpdateAnswer>, new_answer: u64) -> Result<()> {
        update_answer(ctx, new_answer)
    }

    pub fn remove_answer(ctx: Context<DeleteAnswer>) -> Result<()> {
        delete_answer(ctx)
    }
}
