use anchor_lang::prelude::*;

#[error_code]
pub enum WisdomOfCrowdError {
    #[msg("Question is too long")]
    QuestionTooLong,
    AnswerIsNotNumber,
}