// SPDX-License-Identifier: BSD-4-Clause

pragma solidity ^0.8.0;

contract MerkleRootStorage32 {
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
        bytes32[] memory hashed = new bytes32[](proof.length);

        for (uint256 i = 0; i < proof.length; i++) {
            hashed[i] = keccak256(abi.encodePacked(HASH_PREFIX, proof[i]));
        }

        bytes32[] memory computedHashes = new bytes32[](leaves.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            bytes32 computedHash = leaves[i];

            for (uint256 j = 0; j < proof.length; j++) {
                if (computedHash < hashed[j]) {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, computedHash, hashed[j]));
                } else {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, hashed[j], computedHash));
                }
            }

            computedHashes[i] = computedHash;
        }

        for (uint256 i = 0; i < computedHashes.length; i++) {
            bytes32 compact = computedHashes[i];
            results[i] = verified[compact];
        }

        return results;
    }

    event MerkleRootStored(bytes32 merkleRootCompact);
}
