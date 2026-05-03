pragma solidity ^0.8.31;
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { BaseRWAToken }          from "../core/BaseRWAToken.sol";
import { RWALib }                from "../libraries/RWALib.sol";
contract GoldToken is BaseRWAToken {
    AggregatorV3Interface public priceFeed;
    uint256 public totalGoldGrams;
    event GoldPriceSynced(uint256 priceUSD, uint256 valuationUSD, uint80 roundId);
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
            "Terravio Gold",
            "tvGOLD",
            asset_,
            RWALib.AssetType.GOLD,
            ipfsCID_,
            yieldBPS_,
            kycManager_,
            admin_
        );
        priceFeed      = AggregatorV3Interface(priceFeed_);
        totalGoldGrams = totalGoldGrams_;
        _syncFromChainlink();
    }
    function syncGoldPrice() external {
        _syncFromChainlink();
    }
    function getLatestGoldPrice() external view returns (uint256 priceUSD, uint80 roundId) {
        (
            uint80 _roundId,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();
        if (answer <= 0) revert RWALib.InvalidPrice(answer);
        if (block.timestamp - updatedAt > RWALib.MAX_ORACLE_STALENESS)
            revert RWALib.StalePrice(updatedAt);
        priceUSD = uint256(answer) * RWALib.CHAINLINK_TO_WAD;
        roundId  = _roundId;
    }
    function _syncFromChainlink() internal {
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
        ) = priceFeed.latestRoundData();
        if (answer <= 0) revert RWALib.InvalidValuation(0);
        if (block.timestamp - updatedAt > RWALib.MAX_ORACLE_STALENESS)
            revert RWALib.InvalidValuation(uint256(answer));
        uint256 pricePerGram18 = uint256(answer) * RWALib.CHAINLINK_TO_WAD;
        uint256 totalValuation = (pricePerGram18 * totalGoldGrams) / RWALib.PRECISION;
        _updateValuation(totalValuation);
        emit GoldPriceSynced(pricePerGram18, totalValuation, roundId);
    }
    function updatePriceFeed(address newFeed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeed == address(0)) revert RWALib.ZeroAddress();
        priceFeed = AggregatorV3Interface(newFeed);
    }
}