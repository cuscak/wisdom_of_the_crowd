use anchor_lang::prelude::*;

const DISCRIMINATOR_LENGTH: usize = 8;

pub const QUESTION_LENGHT: usize = 500;

pub const QUESTION_SEED: &str = "QUESTION_SEED";
pub const ANSWER_SEED: &str = "ANSWER_SEED";
pub const QUESTION_STATS_SEED: &str = "QUESTION_STATS_SEED";

#[account]
pub struct Question {
    pub author: Pubkey,
    pub question: [u8; QUESTION_LENGHT],
    pub treshold: u32,
    pub bump: u8,
    //todo add finacial reward for people answering the question
    //pub reward_per_answer: u64,
}

impl Question {
    // Pubkey + [u8, QUESTION_LENGHT] + u32 + u8
    pub const LEN: usize = DISCRIMINATOR_LENGTH + 32 + QUESTION_LENGHT + 4 + 1;
}

#[account]
pub struct QuestionStats {
    pub question_acc: Pubkey,
    pub answers_count: u32,
    pub sum: u64,
    pub average: u64,
    pub bump: u8,
}

impl QuestionStats {
    // Pubkey + u32 + u64+ u64 + u8
    pub const LEN: usize = DISCRIMINATOR_LENGTH + 32 + 4 + 8 + 8 + 1;
}

#[account]
pub struct Answer {
    pub answer: u64, //so far only numbers allowed so we can calculate average
    pub question_acc: Pubkey,
    pub user: Pubkey,
}

impl Answer {
    // u64 + Pubkey + Pubkey
    pub const LEN: usize = DISCRIMINATOR_LENGTH + 8 + 32 + 32;
}
