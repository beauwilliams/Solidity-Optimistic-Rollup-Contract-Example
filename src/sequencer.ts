import { ethers as ethersjs } from "ethers";
import { MerkleTree } from "merkletreejs";

interface Transaction {
  target: string;
  data: string;
  value: string;
  gasLimit: number;
  signature: string; // the function signature of the executeTransaction function
  calldataLength: number; // the length of the encoded calldata for the executeTransaction function
}

export async function batchAndStoreTransactions(
  transactions: Transaction[],
  contract: ethersjs.Contract,
  privateKey: string
): Promise<void> {
  const provider = contract.provider!;
  const signer = new ethersjs.Wallet(privateKey, provider);
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
      )
    ])
  );
  batchedTxData.push(txData);
  totalGasLimit += tx.gasLimit;
}

  const tx = {
    to: contract.address,
    gasLimit: totalGasLimit,
    gasPrice: gasPrice.mul(2),
    data: "0x" + batchedTxData.join(""),
  };

  const signedTx = await signer.signTransaction(tx);
  const txReceipt = await provider.sendTransaction(signedTx);
  await txReceipt.wait();

  const leafData: string[] = [];
  for (const txData of batchedTxData) {
    leafData.push(
      ethersjs.utils
        .keccak256(ethersjs.utils.defaultAbiCoder.encode(["bytes"], [txData]))
        .toString()
    );
  }

  const tree = new MerkleTree(leafData);
  const root = "0x" + tree.getHexRoot();

  await contract.storeMerkleRoot(root);
}
