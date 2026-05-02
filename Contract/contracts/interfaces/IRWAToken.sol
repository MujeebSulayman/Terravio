pragma solidity ^0.8.20;
import { RWALib } from "../libraries/RWALib.sol";
interface IRWAToken {
    event ValuationUpdated(uint256 indexed oldValue, uint256 indexed newValue, uint64 timestamp);
    event InvestorWhitelisted(address indexed investor);
    event InvestorRemovedFromWhitelist(address indexed investor);
    event YieldClaimed(address indexed investor, uint256 amount);
    event YieldRateUpdated(uint256 oldBPS, uint256 newBPS);
    function getAssetMetadata() external view returns (RWALib.AssetMetadata memory);
    function getCurrentValuation() external view returns (uint256);
    function getYieldRate() external view returns (uint256);
    function isWhitelisted(address investor) external view returns (bool);
    function getAssetType() external view returns (RWALib.AssetType);
    function claimableYield(address investor) external view returns (uint256);
    function whitelistInvestor(RWALib.WhitelistApproval calldata approval) external;
    function removeFromWhitelist(address investor) external;
    function claimYield() external;
    function updateIPFSCID(string calldata newCID) external;
}