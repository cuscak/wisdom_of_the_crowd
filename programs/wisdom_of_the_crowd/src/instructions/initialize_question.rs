use crate::{errors::WisdomOfCrowdError, states::*};
use anchor_lang::prelude::*;

pub fn initialize_question(
    ctx: Context<InitializeQuestion>,
    question: String,
    treshold: u32,
) -> Result<()> {
    require!(
        question.as_bytes().len() <= QUESTION_LENGHT,
        WisdomOfCrowdError::QuestionTooLong
    );

    //todo check treshold size so its fits in u32

    let created_question = &mut ctx.accounts.question_acc;

    // coping data from String into bytearray
    let mut question_data = [0u8; QUESTION_LENGHT];
    question_data[..question.as_bytes().len()].copy_from_slice(question.as_bytes());

    created_question.author = *ctx.accounts.user.key;
    created_question.question = question_data;
    created_question.treshold = treshold;
    created_question.bump = *ctx.bumps.get("question_acc").unwrap();

    Ok(())
}

#[derive(Accounts)]
#[instruction(question: String)]
pub struct InitializeQuestion<'info> {
    #[account(
        init,
        payer = user,
        space = Question::LEN,
        seeds = [
            anchor_lang::solana_program::hash::hash(question.as_bytes()).to_bytes().as_ref(),
            QUESTION_SEED.as_bytes(),
            user.key().as_ref(),
            ],
        bump
    )]
    pub question_acc: Account<'info, Question>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
