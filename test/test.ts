// Import the necessary libraries
const { expect } = require('chai');
const { ethers } = require('hardhat');

// Define the mock data
const MOCK_MERKLE_ROOT = "0x00000000000000000000000000000001";
const MOCK_LEAVES = [
    "0x00000000000000000000000000000002",
    "0x00000000000000000000000000000003",
    "0x00000000000000000000000000000004"
];
const MOCK_PROOFS = [
    "0x00000000000000000000000000000005",
    "0x00000000000000000000000000000006",
    "0x00000000000000000000000000000007"
];

describe("MerkleRootStorage contract", function() {
  let merkleRootStorage: any;

  beforeEach(async () => {
    // Deploy the contract before each test
    const MerkleRootStorage = await ethers.getContractFactory("MerkleRootStorage");
    merkleRootStorage = await MerkleRootStorage.deploy();
    await merkleRootStorage.deployed();
  });

  it("should store the merkle root correctly", async function() {
    // Call the storeMerkleRoot function with the mock merkle root
    await merkleRootStorage.storeMerkleRoot(MOCK_MERKLE_ROOT);

    // Check that the merkle root was stored correctly
    expect(await merkleRootStorage.merkleRootCompact()).to.equal(MOCK_MERKLE_ROOT);
    expect(await merkleRootStorage.verified(MOCK_MERKLE_ROOT)).to.be.true;
  });

  it("should verify the merkle proof correctly", async function() {
    // Call the storeMerkleRoot function with the mock merkle root
    await merkleRootStorage.storeMerkleRoot(MOCK_MERKLE_ROOT);

    // Call the verifyMerkleProof function with the mock leaves and proofs
    const results = await merkleRootStorage.verifyMerkleProof(MOCK_LEAVES, MOCK_PROOFS);

    // Check that the results match the expected values
    expect(results).to.deep.equal([false, false, false]);
  });

  it("should not store a zero merkle root", async function() {
    // Try to call the storeMerkleRoot function with a zero merkle root
    await expect(merkleRootStorage.storeMerkleRoot(ethers.utils.hexZeroPad("0x",16))).to.be.revertedWith("Merkle root cannot be zero");
  });

  it("should not store a merkle root that has already been verified", async function() {
    // Call the storeMerkleRoot function with the mock merkle root
    await merkleRootStorage.storeMerkleRoot(MOCK_MERKLE_ROOT);

    // Try to call the storeMerkleRoot function with the same merkle root again
    await expect(merkleRootStorage.storeMerkleRoot(MOCK_MERKLE_ROOT)).to.be.revertedWith("Merkle root already verified");
  });

  it("should not verify a merkle proof with arrays of different lengths", async function() {
    // Try to call the verifyMerkleProof function with arrays of different lengths
    await expect(merkleRootStorage.verifyMerkleProof(MOCK_LEAVES.slice(0, 2), MOCK_PROOFS)).to.be.revertedWith("Arrays must be of the same length");
  });
});
