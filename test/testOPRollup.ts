import { expect } from "chai";
import { ethers } from "hardhat";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";


//@USAGE: const leafHexlified = leaf.map(toBytes32);
//@PARAM: array of leaves
function toBytes32(value: any) {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(value), 32);
}

describe("OptimisticRollup", function () {
  let rollupContract: any;
  let merkleRootIndex: any;
  let tokenContract: any;
  let tree: any;
  let leaf: any;
  let invalidLeaf: any;

  beforeEach(async function () {
    /* tokenContract = await (await ethers.getContractFactory('IERC20Mock')).deploy();
    await tokenContract.deployed();
    await tokenContract.mint(rollupContract.address, 1000000); */
    rollupContract = await (
      await ethers.getContractFactory("OptimisticRollup")
    ).deploy("0x1111111111111111111111111111111111111111");
    await rollupContract.deployed();

    const addr1 = "0xa54d3c09E34aC96807c1CC397404bF2B98DC4eFb";
    const addr2 = "0x8ba1f109551bd432803012645ac136ddd64dba72";

    //Sender, amount, nonce
    const txs = [
      [addr1, 1000, 0],
      [addr2, 500, 1],
    ];

    const treeData = StandardMerkleTree.of(txs, [
      "address",
      "uint256",
      "uint256",
    ]);
    tree = treeData;
    invalidLeaf = "0x06";

    merkleRootIndex = 0;
    await rollupContract.storeMerkleRoot(tree.root);
  });

  it("should store Merkle root of some fake eth transactions", async function () {
    const storedMerkleRoot = await rollupContract.merkleRoots(merkleRootIndex);
    expect(storedMerkleRoot).to.equal(tree.root);
  });

  it("should verify valid Merkle proof in js and in contract implementation", async function () {
    const storedMerkleRoot = await rollupContract.merkleRoots(merkleRootIndex);
    leaf = tree.values[0].value[0];
    expect(storedMerkleRoot).to.equal(tree.root);

    //NOTE: Iterate through transaction leaves and proof them in the contract
    for (const [i, v] of tree.entries()) {
      leaf = tree.values[i].value;
      //NOTE: We hash the leaf equivalent to below solidity expression
      //bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(leaf[]))));
      const leafHashed = tree.leafHash(leaf);

      const proof = tree.getProof(i);
      console.log("Index:", merkleRootIndex);
      console.log("Value:", v);
      console.log("Proof:", proof);
      const verified = await rollupContract.verifyMerkleProof(
        merkleRootIndex,
        proof,
        leafHashed
      );
      expect(verified).to.be.true;
    }

    //NOTE: Test with js library to be sure
    for (const [i, v] of tree.entries()) {
      const proof = tree.getProof(i);
      leaf = tree.values[i].value;
      const verified = StandardMerkleTree.verify(
        tree.root,
        ["address", "uint256", "uint256"],
        tree.values[i].value,
        proof
      );
      expect(verified).to.be.true;
    }
  });

  it("should not verify invalid Merkle proof", async function () {
    const proof = tree.getProof(0);
    const paddedInvalidLeaf = ethers.utils.hexZeroPad(invalidLeaf, 32);

    const verified = await rollupContract.verifyMerkleProof(
      merkleRootIndex,
      proof,
      paddedInvalidLeaf
    );
    expect(verified).to.be.false;
  });
});
