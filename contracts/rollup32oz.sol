// SPDX-License-Identifier: BSD-4-Clause

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleRootStorage32OZ {
    constructor() {
        sequencer = msg.sender;
    }

    modifier onlySequencer() {
        require(msg.sender == sequencer, "Only contract sequencer can call this function");
        _;
    }

    address public sequencer;
    mapping(bytes32 => bool) public verified;
    bytes32 constant HASH_PREFIX = bytes32(uint256(42));

    function storeMerkleRoot(bytes32 _merkleRoot) public onlySequencer {
        require(_merkleRoot != bytes32(0), "Merkle root cannot be zero");
        require(!verified[_merkleRoot], "Merkle root already verified");

        verified[_merkleRoot] = true;
        emit MerkleRootStored(_merkleRoot);
    }

    function verifyMerkleProof(bytes32[] memory leaves, bytes32[] memory proof) public view returns(bool[] memory) {
        require(leaves.length == proof.length, "Arrays must be of the same length");

        bool[] memory results = new bool[](leaves.length);

        for (uint256 i = 0; i < leaves.length; i++) {
            bytes32 leaf = leaves[i];
            bytes32 root = keccak256(abi.encodePacked(HASH_PREFIX, leaf));

            // results[i] = MerkleProof.verify(proof, root, verified[computeMerkleTreeRoot(leaves, i)]);
        }

        return results;
    }

    function computeMerkleTreeRoot(bytes32[] memory leaves, uint256 index) public pure returns (bytes32) {
        uint256 n = leaves.length;
        require(n > 0 && (n & (n - 1)) == 0, "Merkle tree must have a power of 2 number of leaves");

        bytes32[] memory tree = new bytes32[](n * 2);
        for (uint256 i = 0; i < n; i++) {
            tree[n + i] = keccak256(abi.encodePacked(HASH_PREFIX, leaves[i]));
        }

        for (uint256 i = n - 1; i > 0; i--) {
            bytes32 left = tree[i * 2];
            bytes32 right = tree[i * 2 + 1];
            tree[i] = keccak256(abi.encodePacked(HASH_PREFIX, left, right));
        }

        return tree[1];
    }

    event MerkleRootStored(bytes32 merkleRootCompact);
}
