use crate::{errors::WisdomOfCrowdError, states::*};
use anchor_lang::prelude::*;

pub fn delete_answer(ctx: Context<DeleteAnswer>) -> Result<()> {
    let answer_acc = &mut ctx.accounts.answer_acc;

    //update question stats
    let question_stats = &mut ctx.accounts.question_stats_acc;

    let remove_answer_count = match question_stats.answers_count.checked_sub(1) {
        Some(count) => count,
        None => return Err(WisdomOfCrowdError::AnswerCountOverflow.into()),
    };
    question_stats.answers_count = remove_answer_count;

    let remove_answer = match question_stats.sum.checked_sub(answer_acc.answer) {
        Some(count) => count,
        None => return Err(WisdomOfCrowdError::AnswerCountOverflow.into()),
    };
    question_stats.sum = remove_answer;

    let calculate_average = match question_stats.sum
        .checked_div(question_stats.answers_count as u64)
    {
        Some(average) => average,
        None => return Err(WisdomOfCrowdError::AverageCalculationError.into()),
    };
    question_stats.average = calculate_average;

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

    #[account(
        mut,
        seeds = [
            QUESTION_STATS_SEED.as_bytes(),
            question_stats_acc.question_acc.key().as_ref(),
        ],
        bump = question_stats_acc.bump,
    )]
    pub question_stats_acc: Account<'info, QuestionStats>,
}
