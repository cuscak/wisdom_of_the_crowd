use crate::{errors::WisdomOfCrowdError, states::*};
use anchor_lang::prelude::*;

pub fn update_answer(ctx: Context<UpdateAnswer>, new_answer: u64) -> Result<()> {
    let answer_acc = &mut ctx.accounts.answer;

    let old_answer = answer_acc.answer;
    answer_acc.answer = new_answer;

    //update question stats
    let question_stats = &mut ctx.accounts.question_stats_acc;

    let remove_old_answer = match question_stats.sum.checked_sub(old_answer) {
        Some(sum) => sum,
        None => return Err(WisdomOfCrowdError::SumOverflow.into()),
    };
    question_stats.sum = remove_old_answer;

    let add_new_answer = match question_stats.sum.checked_add(new_answer) {
        Some(sum) => sum,
        None => return Err(WisdomOfCrowdError::SumOverflow.into()),
    };
    question_stats.sum = add_new_answer;

    let calculate_average = match question_stats
        .sum
        .checked_div(question_stats.answers_count as u64)
    {
        Some(average) => average,
        None => return Err(WisdomOfCrowdError::AverageCalculationError.into()),
    };

    question_stats.average = calculate_average;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateAnswer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        has_one = question_acc,
        seeds = [
            ANSWER_SEED.as_bytes(),
            user.key().as_ref(),
            question_acc.key().as_ref(),
        ],
        bump,
    )]
    pub answer: Account<'info, Answer>,

    #[account(
        mut,
        seeds = [
            QUESTION_STATS_SEED.as_bytes(),
            question_stats_acc.question_acc.key().as_ref(),
        ],
        bump = question_stats_acc.bump,
    )]
    pub question_stats_acc: Account<'info, QuestionStats>,

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
}
