pragma solidity ^0.8.31;
library RWALib {
    enum AssetType {
        GOLD,
        REAL_ESTATE,
        CARBON_CREDIT
    }
    enum AssetStatus {
        PENDING,
        ACTIVE,
        PAUSED,
        REDEEMED
    }
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
    struct WhitelistApproval {
        address investor;
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
    error NotWhitelisted(address caller);
    error SignatureExpired(uint256 deadline, uint256 blockTimestamp);
    error InvalidSignature();
    error InvalidValuation(uint256 value);
    error InvalidAssetStatus(AssetStatus current, AssetStatus required);
    error UnauthorizedCaller(address caller, bytes32 role);
    error ZeroAddress();
    error ZeroAmount();
    error RequestPending(bytes32 requestId);
    uint256 internal constant BPS_DENOMINATOR = 10_000;
    uint64 internal constant MIN_UPDATE_INTERVAL = 1 hours;
    uint256 internal constant MAX_ORACLE_STALENESS = 25 hours;
    bytes32 internal constant WHITELIST_TYPEHASH =
        keccak256("WhitelistApproval(address investor,uint256 deadline)");
}