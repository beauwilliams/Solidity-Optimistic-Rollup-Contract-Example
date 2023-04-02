
import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';
import { expect } from 'chai';

describe('MerkleRootStorage', () => {
  let contract: Contract;

  const MOCK_MERKLE_ROOT =
    '0x9c7e3df1cc35d7cc65c85b64de7c8e0d159712a470f18a551ae25e7cb382a276';
  const MOCK_LEAVES = [
    '0x47dfce4317f9e0e3c399cc12f1995a25138b0c5d9452dcf5f427e162e6d631c6',
    '0xe1b157c1bde7dc58d16353d03cbf57c23811ca0f315e1f0bcde7c26642f75a2e',
    '0xf3e8a69b745f95b5187c878a1d38aa7f06a9b2bb7ba47d282f3a8b97c28bc542',
  ];
  const MOCK_PROOFS = [
    [
      '0x7b996f76ccf78f6ed1f4a4a76458e44a4d8ceac5e6b5fc5e5f6bb05fc83843f3',
      '0x197e3dadd3d9f5831760e9ef38d0a6b0478e04ec7ce57e294d6825f8bfe9f656',
    ],
    [
      '0xd94e8f08b56e29fc98a76d7ff3d9f1b7a3150981d128b7a6e99a689ce42fbcf1',
      '0x6ac9ed6f199dddb3d3f2f3ce8b57bc2741d583d66cd6c1f6a9afbdb2b2c67b4d',
    ],
    [
      '0x4c4cbdd5f5e5d5e5c8b5f5c1cd5df523d9427c2e048452bbd7c2ed61bb3b7c1b',
      '0x662a5cd1ab0087f0e99df352d87af6f8381e329a139e8ddfccaa3a2c3d3f7917',
    ],
  ];

  before(async () => {
    const contractFactory: ContractFactory = await ethers.getContractFactory(
      'MerkleRootStorage'
    );
    contract = await contractFactory.deploy();
    await contract.deployed();
  });

  it('should store a merkle root', async () => {
    await contract.storeMerkleRoot(MOCK_MERKLE_ROOT);
    expect(await contract.merkleRootCompact()).to.equal(
      ethers.utils.hexDataSlice(MOCK_MERKLE_ROOT, 0, 16)
    );
  });

  it('should not allow storing a zero merkle root', async () => {
    await expect(contract.storeMerkleRoot('0x')).to.be.revertedWith(
      'Merkle root cannot be zero'
    );
  });

it('should verify a merkle proof', async () => {
await contract.storeMerkleRoot(MOCK_MERKLE_ROOT);
for (let i = 0; i < MOCK_LEAVES.length; i++) {
const leaf = MOCK_LEAVES[i];
const proof = MOCK_PROOFS[i];
expect(await contract.verify(leaf, proof)).to.be.true;
}
});

it('should reject an invalid merkle proof', async () => {
await contract.storeMerkleRoot(MOCK_MERKLE_ROOT);
const leaf = MOCK_LEAVES[0];
// Change one of the nodes in the proof
const invalidProof = [
'0x7b996f76ccf78f6ed1f4a4a76458e44a4d8ceac5e6b5fc5e5f6bb05fc83843f3',
'0x197e3dadd3d9f5831760e9ef38d0a6b0478e04ec7ce57e294d6825f8bfe9f655',
];
expect(await contract.verify(leaf, invalidProof)).to.be.false;
});
});
