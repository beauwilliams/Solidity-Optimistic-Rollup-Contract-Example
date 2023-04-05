const { expect } = require("chai");
import { ethers } from "hardhat";
import { batchTransactions } from '../src/sequencer'


describe("Sequencer", function () {
  it("should batch and store transactions", async function () {
    const [owner, account1, account2] = await ethers.getSigners();
    const OptimisticRollup = await ethers.getContractFactory(
      "OptimisticRollup"
    );
    const optimisticRollup = await OptimisticRollup.connect(owner).deploy(
      "0x1111111111111111111111111111111111111111"
    );

    const transactions = [
      {
        target: account1.address,
        data: "0x",
        value: "0",
        gasLimit: 100000,
      },
      {
        target: account2.address,
        data: "0x",
        value: "0",
        gasLimit: 100000,
      },
    ];

    const batchedTxData = await batchTransactions(
      transactions,
      optimisticRollup
    );
console.log('batchedTxData', batchedTxData)

    expect(batchedTxData.totalGasLimit).to.eq(200000);
  });
});
