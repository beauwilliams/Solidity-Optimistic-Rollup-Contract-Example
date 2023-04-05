import { ethers as ethersjs } from "ethers";
import { ethers } from "hardhat";
interface Transaction {
  target: string;
  data: string;
  value: string;
  gasLimit: number;
}

interface BatchedTransactions {
  batchedTxData: string[];
  totalGasLimit: number;
}

async function batchTransactions(
  transactions: Transaction[],
  contract: ethersjs.Contract
): Promise<BatchedTransactions> {
  const provider = contract.provider!;
  const gasPrice = await provider.getGasPrice();

  const batchedTxData: string[] = [];
  let totalGasLimit = 0;

  for (const tx of transactions) {
    const txData = ethersjs.utils.hexlify(
      ethersjs.utils.concat([
        ethersjs.utils.id("executeTransaction(address,uint256,bytes)"),
        ethersjs.utils.defaultAbiCoder.encode(
          ["address", "uint256", "bytes"],
          [tx.target, tx.value, tx.data]
        ),
      ])
    );
    batchedTxData.push(txData);
    totalGasLimit += tx.gasLimit;
  }

  return { batchedTxData, totalGasLimit };
}

const { expect } = require("chai");

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
    expect(batchedTxData.totalGasLimit).to.eq(200000);
  });
});
