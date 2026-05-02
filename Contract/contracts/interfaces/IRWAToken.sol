// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { RWALib } from "../libraries/RWALib.sol";

/**
 * @title IRWAToken
 * @notice Standard interface every NexusRWA token must implement
 * @dev Implemented by BaseRWAToken and inherited by all asset tokens
 */
interface IRWAToken {

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    /// @notice Emitted when the oracle posts a new valuation
    event ValuationUpdated(uint256 indexed oldValue, uint256 indexed newValue, uint64 timestamp);

    /// @notice Emitted when an investor is added to the whitelist
    event InvestorWhitelisted(address indexed investor);

    /// @notice Emitted when an investor is removed from the whitelist
    event InvestorRemovedFromWhitelist(address indexed investor);

    /// @notice Emitted when yield is claimed by an investor
    event YieldClaimed(address indexed investor, uint256 amount);

    /// @notice Emitted when yield rate is updated
    event YieldRateUpdated(uint256 oldBPS, uint256 newBPS);

    // ─────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────

    /// @notice Returns the full metadata struct for this asset
    function getAssetMetadata() external view returns (RWALib.AssetMetadata memory);

    /// @notice Returns current USD valuation (18 decimals)
    function getCurrentValuation() external view returns (uint256);

    /// @notice Returns annual yield in basis points
    function getYieldRate() external view returns (uint256);

    /// @notice Returns whether an address is KYC whitelisted
    function isWhitelisted(address investor) external view returns (bool);

    /// @notice Returns the asset type enum
    function getAssetType() external view returns (RWALib.AssetType);

    /// @notice Returns claimable yield for an investor
    function claimableYield(address investor) external view returns (uint256);

    // ─────────────────────────────────────────────────────────
    // State-Changing Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Add investor to whitelist via EIP-712 signed approval
     * @param approval Struct containing investor address, deadline, and signature
     */
    function whitelistInvestor(RWALib.WhitelistApproval calldata approval) external;

    /**
     * @notice Remove an investor from the whitelist (admin only)
     * @param investor Address to remove
     */
    function removeFromWhitelist(address investor) external;

    /**
     * @notice Claim accrued yield for caller
     */
    function claimYield() external;

    /**
     * @notice Update asset IPFS document hash (admin only)
     * @param newCID New IPFS CID pointing to updated legal documents
     */
    function updateIPFSCID(string calldata newCID) external;
}
