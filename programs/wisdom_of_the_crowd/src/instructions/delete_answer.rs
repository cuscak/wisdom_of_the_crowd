use crate::states::*;
use anchor_lang::prelude::*;

pub fn delete_answer(_ctx: Context<DeleteAnswer>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct DeleteAnswer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        has_one = user,
        close = user,
        seeds = [
            ANSWER_SEED.as_bytes(),
            user.key().as_ref(),
            answer_acc.question_acc.key().as_ref(),
        ],
        bump
    )]
    pub answer_acc: Account<'info, Answer>,
}
