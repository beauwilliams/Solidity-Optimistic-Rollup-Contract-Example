
pragma solidity ^0.8.0;

contract MerkleRootStorage {
    bytes16 public merkleRootCompact;
    mapping(bytes16 => bool) public verified;
    bytes32 constant HASH_PREFIX = 0x1900;

    function storeMerkleRoot(bytes32 _merkleRoot) public {
        require(_merkleRoot != bytes32(0), "Merkle root cannot be zero");
        bytes16 compact = bytes16(_merkleRoot);
        require(!verified[compact], "Merkle root already verified");

        merkleRootCompact = compact;
        verified[compact] = true;
        emit MerkleRootStored(compact);
    }

    function verifyMerkleProof(bytes32[] memory leaves, bytes32[] memory proof) public view returns(bool[] memory) {
        require(leaves.length == proof.length, "Arrays must be of the same length");

        bool[] memory results = new bool[](leaves.length);
        bytes32[] memory hashed = new bytes32[](proof.length);

        for (uint256 i = 0; i < proof.length; i++) {
            hashed[i] = keccak256(abi.encodePacked(HASH_PREFIX, proof[i]));
        }

        for (uint256 i = 0; i < leaves.length; i++) {
            bytes32 computedHash = leaves[i];

            for (uint256 j = 0; j < proof.length; j++) {
                if (uint256(computedHash) < uint256(hashed[j])) {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, computedHash, hashed[j]));
                } else {
                    computedHash = keccak256(abi.encodePacked(HASH_PREFIX, hashed[j], computedHash));
                }
            }

            bytes16 compact = bytes16(computedHash);
            results[i] = verified[compact];
        }

        return results;
    }

    event MerkleRootStored(bytes16 merkleRootCompact);
}
