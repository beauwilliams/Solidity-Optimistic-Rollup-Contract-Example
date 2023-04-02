// SPDX-License-Identifier: BSD-4-Clause


pragma solidity ^0.8.0;

contract MerkleRootStorage {
    constructor() {
        sequencer = msg.sender;
    }

    modifier onlySequencer() {
        require(msg.sender == sequencer, "Only contract sequencer can call this function");
        _;
    }
    address public sequencer;
    bytes16 public merkleRootCompact;
    mapping(bytes16 => bool) public verified;
    bytes32 constant HASH_PREFIX = bytes32(uint256(6400));

    function storeMerkleRoot(bytes16 _merkleRoot) public onlySequencer {
        require(_merkleRoot != bytes16(0), "Merkle root cannot be zero");
        require(!verified[_merkleRoot], "Merkle root already verified");

        merkleRootCompact = _merkleRoot;
        verified[_merkleRoot] = true;
        emit MerkleRootStored(_merkleRoot);
    }

    function verifyMerkleProof(bytes16[] memory leaves, bytes16[] memory proof) public view returns(bool[] memory) {
        require(leaves.length == proof.length, "Arrays must be of the same length");

        bool[] memory results = new bool[](leaves.length);
        bytes32[] memory hashed = new bytes32[](proof.length);

        for (uint256 i = 0; i < proof.length; i++) {
            hashed[i] = keccak256(abi.encodePacked(HASH_PREFIX, proof[i]));
        }

        bytes16[] memory computedHashes = new bytes16[](leaves.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            bytes32 computedHash = leaves[i];

            for (uint256 j = 0; j < proof.length; j++) {
                if (uint256(computedHash) < uint256(hashed[j])) {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, computedHash, hashed[j]));
                } else {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, hashed[j], computedHash));
                }
            }

            computedHashes[i] = bytes16(computedHash);
        }

        for (uint256 i = 0; i < computedHashes.length; i++) {
            bytes16 compact = computedHashes[i];
            results[i] = verified[compact];
        }

        return results;
    }

    event MerkleRootStored(bytes16 merkleRootCompact);
}
