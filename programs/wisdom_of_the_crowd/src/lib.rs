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
}
