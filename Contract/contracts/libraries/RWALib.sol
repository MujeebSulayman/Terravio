// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RWALib
 * @notice Shared structs, enums, custom errors, and constants for NexusRWA protocol
 * @dev Imported by all core contracts to avoid duplication
 */
library RWALib {

    // ─────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────

    /// @notice Category of the real-world asset
    enum AssetType {
        GOLD,           // Commodity — uses Chainlink Data Feed
        REAL_ESTATE,    // Property  — uses Chainlink Functions
        CARBON_CREDIT   // ESG       — uses Chainlink Functions
    }

    /// @notice Lifecycle state of a tokenized asset
    enum AssetStatus {
        PENDING,    // Created, awaiting first oracle update
        ACTIVE,     // Live, tradeable
        PAUSED,     // Temporarily halted
        REDEEMED    // Asset fully redeemed/closed
    }

    // ─────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Core metadata for a tokenized real-world asset
     * @param assetType         Type of asset (GOLD, REAL_ESTATE, CARBON_CREDIT)
     * @param status            Current lifecycle status
     * @param name              Human-readable name e.g. "Lagos Lekki Property #1"
     * @param symbol            Token symbol e.g. "nxGOLD"
     * @param ipfsCID           IPFS content identifier for legal/supporting documents
     * @param valuationUSD      Latest off-chain valuation in USD (18 decimals)
     * @param yieldBPS          Annual yield in basis points (e.g. 800 = 8%)
     * @param lastUpdated       Timestamp of last oracle valuation update
     * @param totalIssuance     Total fractional tokens minted
     */
    struct AssetMetadata {
        AssetType assetType;
        AssetStatus status;
        string name;
        string symbol;
        string ipfsCID;
        uint256 valuationUSD;
        uint256 yieldBPS;
        uint64 lastUpdated;
        uint256 totalIssuance;
    }

    /**
     * @notice Whitelist approval signed by KYC_MANAGER off-chain (EIP-712)
     * @param investor  Wallet address being approved
     * @param deadline  Unix timestamp after which signature is invalid
     * @param v, r, s   ECDSA signature components
     */
    struct WhitelistApproval {
        address investor;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // ─────────────────────────────────────────────────────────
    // Custom Errors (gas-efficient vs require strings)
    // ─────────────────────────────────────────────────────────

    /// @notice Caller is not on the KYC whitelist
    error NotWhitelisted(address caller);

    /// @notice EIP-712 whitelist signature has expired
    error SignatureExpired(uint256 deadline, uint256 blockTimestamp);

    /// @notice EIP-712 signature is invalid or from wrong signer
    error InvalidSignature();

    /// @notice Oracle returned a stale or zero valuation
    error InvalidValuation(uint256 value);

    /// @notice Operation not allowed in current asset status
    error InvalidAssetStatus(AssetStatus current, AssetStatus required);

    /// @notice Caller does not have the required role
    error UnauthorizedCaller(address caller, bytes32 role);

    /// @notice Zero address passed where not allowed
    error ZeroAddress();

    /// @notice Amount is zero where not allowed
    error ZeroAmount();

    /// @notice Chainlink Functions request already pending
    error RequestPending(bytes32 requestId);

    // ─────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────

    /// @notice Basis points denominator (10000 = 100%)
    uint256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Minimum time between oracle valuation updates (1 hour)
    uint64 internal constant MIN_UPDATE_INTERVAL = 1 hours;

    /// @notice Maximum staleness for oracle data before reverting reads (25 hours)
    uint256 internal constant MAX_ORACLE_STALENESS = 25 hours;

    // ─────────────────────────────────────────────────────────
    // EIP-712 Type Hashes
    // ─────────────────────────────────────────────────────────

    /// @notice EIP-712 typehash for WhitelistApproval struct
    bytes32 internal constant WHITELIST_TYPEHASH =
        keccak256("WhitelistApproval(address investor,uint256 deadline)");
}
