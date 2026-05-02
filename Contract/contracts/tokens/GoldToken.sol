// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import { BaseRWAToken }          from "../core/BaseRWAToken.sol";
import { RWALib }                from "../libraries/RWALib.sol";

/**
 * @title GoldToken
 * @author NexusRWA
 *
 * @notice Tokenized gold commodity. Each token represents fractional ownership
 *         of a gold allocation. Valuation is sourced directly from Chainlink's
 *         XAU/USD price feed — no custom oracle script needed.
 *
 * @dev Standards:
 *   - Inherits BaseRWAToken (ERC-20, ERC-4626, EIP-712, UUPS)
 *   - Chainlink Data Feed: AggregatorV3Interface (latestRoundData)
 *   - Oracle staleness check: rejects data older than MAX_ORACLE_STALENESS
 *
 * @dev Chainlink XAU/USD on Polygon:
 *   Mainnet : 0x0C466540B2ee1a31b441671eac0ca886e051E410
 *   Amoy    : Use mock aggregator in tests
 *
 * @dev Valuation update flow:
 *   Anyone can call syncGoldPrice() → reads Chainlink feed → updates _metadata.valuationUSD
 *   No backend or Chainlink Functions subscription needed for gold.
 */
contract GoldToken is BaseRWAToken {

    // ─────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────

    /// @notice Chainlink XAU/USD price feed aggregator
    AggregatorV3Interface public priceFeed;

    /// @notice Grams of gold this token pool represents (set at init, for reference)
    uint256 public totalGoldGrams;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event GoldPriceSynced(uint256 priceUSD, uint256 valuationUSD, uint80 roundId);

    // ─────────────────────────────────────────────────────────
    // Initializer
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize the GoldToken
     * @param asset_          Underlying ERC-20 for vault (e.g. USDC on Polygon)
     * @param priceFeed_      Chainlink XAU/USD AggregatorV3 address
     * @param totalGoldGrams_ Total grams of physical gold this pool represents
     * @param yieldBPS_       Annual yield in basis points (0 for pure commodity)
     * @param kycManager_     Address that signs whitelist approvals
     * @param admin_          Contract owner
     * @param ipfsCID_        IPFS CID pointing to gold custody documents
     */
    function initialize(
        address asset_,
        address priceFeed_,
        uint256 totalGoldGrams_,
        uint256 yieldBPS_,
        address kycManager_,
        address admin_,
        string memory ipfsCID_
    ) external initializer {
        if (priceFeed_ == address(0)) revert RWALib.ZeroAddress();

        __BaseRWAToken_init(
            "NexusRWA Gold",          // ERC-20 name
            "nxGOLD",                  // ERC-20 symbol
            asset_,
            RWALib.AssetType.GOLD,
            ipfsCID_,
            yieldBPS_,
            kycManager_,
            admin_
        );

        priceFeed      = AggregatorV3Interface(priceFeed_);
        totalGoldGrams = totalGoldGrams_;

        // Immediately sync price on deployment
        _syncFromChainlink();
    }

    // ─────────────────────────────────────────────────────────
    // Oracle Sync — Chainlink Data Feed
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Sync the gold valuation from Chainlink XAU/USD feed
     * @dev Callable by anyone — the feed is already decentralized and trustless.
     *      Performs staleness check: reverts if data is older than MAX_ORACLE_STALENESS.
     *
     * Data Feed returns price with 8 decimals (Chainlink standard for fiat pairs).
     * We scale to 18 decimals internally.
     *
     * Valuation = (XAU/USD price) * (totalGoldGrams) scaled to 18 decimals
     */
    function syncGoldPrice() external {
        _syncFromChainlink();
    }

    /**
     * @notice Returns the latest XAU/USD price from Chainlink (18 decimals)
     * @dev Useful for frontend display without triggering a state write
     */
    function getLatestGoldPrice() external view returns (uint256 priceUSD, uint80 roundId) {
        (
            uint80 _roundId,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();

        require(answer > 0, "GoldToken: invalid price");
        require(
            block.timestamp - updatedAt <= RWALib.MAX_ORACLE_STALENESS,
            "GoldToken: stale price"
        );

        // Chainlink XAU/USD has 8 decimals → scale to 18
        priceUSD = uint256(answer) * 1e10;
        roundId  = _roundId;
    }

    // ─────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Reads Chainlink feed and calls parent _updateValuation()
     *      Chainlink price decimals for XAU/USD = 8
     *      We convert to 18 decimals: price * 1e10
     *      Total valuation = pricePerGram * totalGoldGrams / 1e18
     */
    function _syncFromChainlink() internal {
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();

        if (answer <= 0) revert RWALib.InvalidValuation(0);

        // Staleness check — Chainlink heartbeat for XAU/USD is 24h
        if (block.timestamp - updatedAt > RWALib.MAX_ORACLE_STALENESS)
            revert RWALib.InvalidValuation(uint256(answer));

        // Scale: Chainlink 8 decimals → 18 decimals
        uint256 pricePerGram18 = uint256(answer) * 1e10;

        // Total pool valuation in USD (18 decimals)
        uint256 totalValuation = (pricePerGram18 * totalGoldGrams) / 1e18;

        _updateValuation(totalValuation);

        emit GoldPriceSynced(pricePerGram18, totalValuation, roundId);
    }

    // ─────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Update the Chainlink price feed address (in case of feed migration)
     * @param newFeed New AggregatorV3Interface address
     */
    function updatePriceFeed(address newFeed) external onlyOwner {
        if (newFeed == address(0)) revert RWALib.ZeroAddress();
        priceFeed = AggregatorV3Interface(newFeed);
    }
}
