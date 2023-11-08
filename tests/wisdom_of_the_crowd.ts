import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { WisdomOfTheCrowd } from "../target/types/wisdom_of_the_crowd";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import crypto from "crypto";


const QUESTION_SEED = "QUESTION_SEED";
const ANSWER_SEED = "ANSWER_SEED";
const QUESTION_STATS_SEED = "QUESTION_STATS_SEED";

describe("wisdom_of_the_crowd", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.WisdomOfTheCrowd as Program<WisdomOfTheCrowd>;

  //#region -- consts
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();
  const user3 = anchor.web3.Keypair.generate();

  const user1_question1 = "What will be the price of SOL at the end of the year 2023?";
  const user1_question1_treshold = 1000;

  const user1_question2 = "How many apartments are sold in Prague each month";
  const user1_question2_treshold = 100;

  const user2_question = "Some very long question...".repeat(20);
  const user2_question_treshold = 1000;

  const answerValue = new BN(50);
  const answerNewValue = new BN(500);

  const initialAvarage = new BN(0);
  const initialSum = new BN(0);

  const user3AnswerValue = new BN(33);
  //#endregion -- consts

  before(async () => {
    //#region -- get some money for users
    const connection = anchor.getProvider().connection;

    const airdropSignature1 = await connection.requestAirdrop(user1.publicKey, 1000000000);

    // TransactionConfirmationStrategy is used to specify how the transaction should be confirmed
    //user1
    await connection.confirmTransaction({
      signature: airdropSignature1,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await connection.getSlot()) + 500, // Add some reasonable number for block height expectation
    }, "confirmed");

    //user2
    const airdropSignature2 = await connection.requestAirdrop(user2.publicKey, 1000000000);
    await connection.confirmTransaction({
      signature: airdropSignature2,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await connection.getSlot()) + 500, // Add some reasonable number for block height expectation
    }, "confirmed");

    //user3
    const airdropSignature3 = await connection.requestAirdrop(user3.publicKey, 1000000000);
    await connection.confirmTransaction({
      signature: airdropSignature3,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: (await connection.getSlot()) + 500, // Add some reasonable number for block height expectation
    }, "confirmed");

    //#endregion
  });

  describe("Question creation", async () => {

    it("User can create question", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);

      const tx = await program.methods.initialize(user1_question1, user1_question1_treshold)
        .accounts({
          questionAcc: questionPDA,
          questionStatsAcc: questionStatsPDA,
          user: user1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc({ commitment: "confirmed" });

      let questionAccount = await program.account.question.fetch(questionPDA);
      const utf8ByteArray_test_question = new TextEncoder().encode(user1_question1);
      const paddedByteArray_test_question = padByteArrayWithZeroes(utf8ByteArray_test_question, 500);

      assert.strictEqual(questionAccount.question.toString(), paddedByteArray_test_question.toString());
      assert.strictEqual(questionAccount.treshold, user1_question1_treshold);

      let questionStatsAccount = await program.account.questionStats.fetch(questionStatsPDA);
      assert.strictEqual(questionStatsAccount.answersCount, 0);
      assert.strictEqual(questionStatsAccount.average.toString(), initialAvarage.toString());
      assert.strictEqual(questionStatsAccount.sum.toString(), initialSum.toString());
    });

    it("User can create second questions", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question2, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);

      const tx = await program.methods.initialize(user1_question2, user1_question2_treshold)
        .accounts({
          questionAcc: questionPDA,
          questionStatsAcc: questionStatsPDA,
          user: user1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user1])
        .rpc({ commitment: "confirmed" });

      let questionAccount = await program.account.question.fetch(questionPDA);
      const utf8ByteArray_test_question = new TextEncoder().encode(user1_question2);
      const paddedByteArray_test_question = padByteArrayWithZeroes(utf8ByteArray_test_question, 500);

      assert.strictEqual(questionAccount.question.toString(), paddedByteArray_test_question.toString());
      assert.strictEqual(questionAccount.treshold, user1_question2_treshold);
    });

    it("Question is not created with text longer than 500 bytes", async () => {
      let should_fail = "This Should Fail"

      try {
        const [questionPDA, questionBump] = getQuestionPDA(user2_question, user2.publicKey, program.programId);
        const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);

        const tx = await program.methods.initialize(user2_question, user2_question_treshold)
          .accounts({
            questionAcc: questionPDA,
            questionStatsAcc: questionStatsPDA,
            user: user2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc({ commitment: "confirmed" });

      } catch (error) {
        const err = anchor.AnchorError.parse(error.logs);
        assert.strictEqual(err.error.errorCode.code, "QuestionTooLong");
        should_fail = "Failed"
      }

      assert.strictEqual(should_fail, "Failed")
    });
  });

  describe("Answering questions", async () => {
    it("User can add answer to created question", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);
      const [answerPDA, answerBump] = getAnswerPDA(user2.publicKey, questionPDA, program.programId);

      const tx = await program.methods.createAnswer(answerValue)
        .accounts({
          user: user2.publicKey,
          answer: answerPDA,
          questionStatsAcc: questionStatsPDA,
          questionAcc: questionPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user2])
        .rpc({ commitment: "confirmed" });

      let answerAccount = await program.account.answer.fetch(answerPDA);
      assert.strictEqual(answerAccount.answer.toString(), answerValue.toString());
      assert.strictEqual(answerAccount.questionAcc.toString(), questionPDA.toString());

      //check if question stats where updated
      let questionStatsAccount = await program.account.questionStats.fetch(questionStatsPDA);
      assert.strictEqual(questionStatsAccount.answersCount, 1);
      assert.strictEqual(questionStatsAccount.average.toString(), answerValue.toString());
      assert.strictEqual(questionStatsAccount.sum.toString(), answerValue.toString());

    });

    it("User cant answer same question again", async () => {
      let should_fail = "This should fail";

      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);
      const [answerPDA, answerBump] = getAnswerPDA(user2.publicKey, questionPDA, program.programId);

      try {
        const tx = await program.methods.createAnswer(answerNewValue)
          .accounts({
            user: user2.publicKey,
            answer: answerPDA,
            questionStatsAcc: questionStatsPDA,
            questionAcc: questionPDA,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([user2])
          .rpc({ commitment: "confirmed", skipPreflight: true });
      } catch (error) {
        should_fail = "Failed";
        assert.isTrue(SolanaError.contains(error.logs, "already in use"), error.logs)
      }

    });

    it("User can update his answer", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);
      const [answerPDA, answerBump] = getAnswerPDA(user2.publicKey, questionPDA, program.programId);

      const tx = await program.methods.changeAnswer(answerNewValue)
        .accounts({
          user: user2.publicKey,
          answer: answerPDA,
          questionStatsAcc: questionStatsPDA,
          questionAcc: questionPDA,
        })
        .signers([user2])
        .rpc({ commitment: "confirmed", skipPreflight: true });

      let answerAccount = await program.account.answer.fetch(answerPDA);
      assert.strictEqual(answerAccount.answer.toString(), answerNewValue.toString());

      //check if question stats where updated
      let questionStatsAccount = await program.account.questionStats.fetch(questionStatsPDA);
      assert.strictEqual(questionStatsAccount.answersCount, 1);
      assert.strictEqual(questionStatsAccount.average.toString(), answerNewValue.toString());
      assert.strictEqual(questionStatsAccount.sum.toString(), answerNewValue.toString());
    });

    it("Another user added his answer and question stats are correctly updated", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);
      const [answerPDA, answerBump] = getAnswerPDA(user3.publicKey, questionPDA, program.programId);

      const tx = await program.methods.createAnswer(user3AnswerValue)
        .accounts({
          user: user3.publicKey,
          answer: answerPDA,
          questionStatsAcc: questionStatsPDA,
          questionAcc: questionPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user3])
        .rpc({ commitment: "confirmed" });

      //check if question stats where updated
      let questionStatsAccount = await program.account.questionStats.fetch(questionStatsPDA);
      assert.strictEqual(questionStatsAccount.answersCount, 2);

      //question should have 2 answers, first was updated to value answerNewValue = 500, second is user3AnswerValue = 33
      const expectedSum = answerNewValue.toNumber() + user3AnswerValue.toNumber();
      const expectedAverage = Math.floor(expectedSum / 2);

      assert.strictEqual(questionStatsAccount.average.toString(), expectedAverage.toString());
      assert.strictEqual(questionStatsAccount.sum.toString(), expectedSum.toString());

    });

    it("User can delete his answer", async () => {
      const [questionPDA, questionBump] = getQuestionPDA(user1_question1, user1.publicKey, program.programId);
      const [questionStatsPDA, questionStatsBump] = getQuestionStatsPDA(questionPDA, program.programId);
      const [answerPDA, answerBump] = getAnswerPDA(user2.publicKey, questionPDA, program.programId);

      const tx = await program.methods.removeAnswer()
        .accounts({
          user: user2.publicKey,
          answerAcc: answerPDA,
          questionStatsAcc: questionStatsPDA,
        })
        .signers([user2])
        .rpc({ commitment: "confirmed", skipPreflight: true });

      //check if question stats where updated
      let questionStatsAccount = await program.account.questionStats.fetch(questionStatsPDA);
      assert.strictEqual(questionStatsAccount.answersCount, 1);

      //question should have 1 answers, first was deleted and only second answer left where user3AnswerValue = 33

      assert.strictEqual(questionStatsAccount.average.toString(), user3AnswerValue.toString());
      assert.strictEqual(questionStatsAccount.sum.toString(), user3AnswerValue.toString());

      let thisShouldFail = "This should fail";

      try {
        let answerAccount = await program.account.answer.fetch(answerPDA);
      } catch (error) {
        thisShouldFail = "Failed"
        assert.isTrue(error.message.includes("Account does not exist or has no data"))
      }

      assert.strictEqual(thisShouldFail, "Failed")
    });

  });

});


function getQuestionPDA(question: string, user: PublicKey, programID: PublicKey) {

  let hexString = crypto.createHash('sha256').update(question, 'utf-8').digest('hex');
  let question_seed = Uint8Array.from(Buffer.from(hexString, 'hex'));

  return PublicKey.findProgramAddressSync(
    [
      question_seed,
      anchor.utils.bytes.utf8.encode(QUESTION_SEED),
      user.toBuffer()
    ], programID);
}

function getQuestionStatsPDA(questionAcc: PublicKey, programID: PublicKey) {

  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(QUESTION_STATS_SEED),
      questionAcc.toBuffer(),
    ], programID);
}

function getAnswerPDA(user: PublicKey, questionAcc: PublicKey, programID: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(ANSWER_SEED),
      user.toBuffer(),
      questionAcc.toBuffer(),
    ], programID);
}

// Function to pad a byte array with zeroes to a specified length
function padByteArrayWithZeroes(byteArray: Uint8Array, length: number): Uint8Array {
  if (byteArray.length >= length) {
    return byteArray;
  }

  const paddedArray = new Uint8Array(length);
  paddedArray.set(byteArray, 0);
  return paddedArray;
}


class SolanaError {
  static contains(logs, error): boolean {
    const match = logs?.filter(s => s.includes(error));
    return Boolean(match?.length)
  }
}