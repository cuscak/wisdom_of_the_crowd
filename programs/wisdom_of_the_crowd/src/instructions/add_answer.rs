use crate::states::*;
use anchor_lang::prelude::*;

pub fn add_answer(ctx: Context<AddAnswer>, answer: u64) -> Result<()> {
    //answer can only be numbers

    let answer_acc = &mut ctx.accounts.answer;
    answer_acc.answer = answer;
    answer_acc.user = *ctx.accounts.user.key;
    answer_acc.question_acc = ctx.accounts.question_acc.key();

    Ok(())
}

#[derive(Accounts)]
pub struct AddAnswer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + Answer::LEN,
        seeds = [
            ANSWER_SEED.as_bytes(),
            user.key().as_ref(),
            question_acc.key().as_ref(),
        ],
        bump
    )]
    pub answer: Account<'info, Answer>,

    #[account(
        mut,
        seeds = [
            //this horror line is needed due to how we store question (pub question: [u8; QUESTION_LENGHT])
            //its converts [u8; 500] into String and creates hash from it (so its is 32 bytes long to fullfil seed constraint)
            anchor_lang::solana_program::hash::hash(&question_acc.question[..question_acc.question.iter().position(|&x| x == 0).unwrap_or(500)]).to_bytes().as_ref(),
            QUESTION_SEED.as_bytes(),
            question_acc.author.key().as_ref(),
        ],
        bump = question_acc.bump,
    )]
    pub question_acc: Account<'info, Question>,

    pub system_program: Program<'info, System>,
}
