use anchor_lang::prelude::*;

pub const QUESTION_LENGHT: usize = 500;

pub const QUESTION_SEED: &str = "QUESTION_SEED";
pub const ANSWER_SEED: &str = "ANSWER_SEED";

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
    pub const LEN: usize = 32 + QUESTION_LENGHT + 4 + 1;
}

#[account]
pub struct Answer {
    pub answer: u64,        //so far only numbers allowed so we can calculate average
    pub question_acc: Pubkey,
    pub user: Pubkey,
}

impl Answer {
    // u64 + Pubkey + Pubkey
    pub const LEN: usize = 8 + 32 + 32;
}