// SPDX-License-Identifier: BSD-4-Clause

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract OptimisticRollup {
    // Storage for the Merkle roots
    mapping(uint256 => bytes32) public merkleRoots;
    uint256 public merkleRootIndex;

    event NewMerkleRoot(uint256 indexed index, bytes32 indexed merkleRoot);

    // Stores a new Merkle root
    function storeMerkleRoot(bytes32 _merkleRoot) external {
        merkleRoots[merkleRootIndex] = _merkleRoot;
        emit NewMerkleRoot(merkleRootIndex, _merkleRoot);
        merkleRootIndex++;
    }

    // Verifies a Merkle proof against a specific Merkle root
    function verifyMerkleProof(
        uint256 _merkleRootIndex,
        bytes32[] memory _merkleProof,
        bytes32 _leaf
    ) public view returns (bool) {
        bytes32 merkleRoot = merkleRoots[_merkleRootIndex];

        // Check if the proof is valid
        bool isValid = MerkleProof.verify(_merkleProof, merkleRoot, _leaf);

        return isValid;
    }

    // Fraud proof storage
    mapping(uint256 => FraudProof) public fraudProofs;
    uint256 public fraudProofIndex;

    struct FraudProof {
        address challenger;
        uint256 merkleRootIndex;
        bytes32[] merkleProof;
        bytes32 invalidLeaf;
        bool resolved;
    }

    event FraudProofSubmitted(uint256 indexed index, address indexed challenger);
    event FraudProofResolved(uint256 indexed index, bool indexed success);

    // Submit a fraud proof
    // Submit a fraud proof
    function submitFraudProof(
        uint256 _merkleRootIndex,
        bytes32[] calldata _merkleProof,
        bytes32 _invalidLeaf
    ) external {

        fraudProofs[fraudProofIndex] = FraudProof({
            challenger: msg.sender,
            merkleRootIndex: _merkleRootIndex,
            merkleProof: _merkleProof,
            invalidLeaf: _invalidLeaf,
            resolved: false
        });

        emit FraudProofSubmitted(fraudProofIndex, msg.sender);
        fraudProofIndex++;
    }

   // Resolve a fraud proof
    function resolveFraudProof(uint256 _fraudProofIndex) external {
        FraudProof storage fraudProof = fraudProofs[_fraudProofIndex];

        // Ensure fraud proof has not been resolved
        require(!fraudProof.resolved, "Fraud proof already resolved");

        // Verify Merkle proof
        bool isValid = verifyMerkleProof(
            fraudProof.merkleRootIndex,
            fraudProof.merkleProof,
            fraudProof.invalidLeaf
        );

        // If the Merkle proof is valid, the submitted fraud proof is successful
        if (isValid) {
            // Invalidate the Merkle root (e.g., by removing it or marking it as invalid)
            delete merkleRoots[fraudProof.merkleRootIndex];
        }

        // Mark fraud proof as resolved
        fraudProof.resolved = true;
        emit FraudProofResolved(_fraudProofIndex, isValid);
    }

    //DEPOSITS & WITHDRAWAL
     IERC20 public token; // The ERC20 token used for deposits and withdrawals

    // Deposit event
    event Deposit(address indexed depositor, uint256 amount, uint256 nonce);

    // Withdrawal event
    event Withdrawal(address indexed withdrawer, uint256 amount);

    // Nonce to prevent replay attacks
    mapping(address => uint256) public nonces;

    constructor(IERC20 _token) {
        token = _token;
    }

    // Deposit function
    function deposit(uint256 _amount) external {
        // Transfer the tokens from the depositor to the contract
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");

        // Emit a deposit event
        emit Deposit(msg.sender, _amount, nonces[msg.sender]);

        // Increment the nonce
        nonces[msg.sender]++;
    }

    // Withdrawal function
    function withdraw(
        uint256 _amount,
        bytes32[] calldata _merkleProof,
        uint256 _nonce
    ) external {
        // Verify the withdrawal Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, _amount, _nonce));
        require(verifyMerkleProof(merkleRootIndex, _merkleProof, leaf), "Invalid Merkle proof");

        // Ensure the nonce is greater than the user's current nonce
        require(_nonce > nonces[msg.sender], "Invalid nonce");

        // Update the nonce
        nonces[msg.sender] = _nonce;

        // Transfer the tokens from the contract to the withdrawer
        require(token.transfer(msg.sender, _amount), "Token transfer failed");

        // Emit a withdrawal event
        emit Withdrawal(msg.sender, _amount);
    }
}
