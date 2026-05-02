pragma solidity ^0.8.20;
import { RWALib } from "../libraries/RWALib.sol";
interface IAssetRegistry {
    event ImplementationRegistered(RWALib.AssetType indexed assetType, address implementation);
    event AssetDeployed(
        uint256 indexed assetId,
        address indexed tokenAddress,
        RWALib.AssetType assetType,
        string name
    );
    event AssetDeactivated(uint256 indexed assetId, address tokenAddress);
    function registerImplementation(RWALib.AssetType assetType, address implementation) external;
    function deployAsset(RWALib.AssetType assetType, bytes calldata initData)
        external returns (uint256 assetId, address clone);
    function deactivateAsset(uint256 assetId) external;
    function getAssetsByType(RWALib.AssetType assetType) external view returns (address[] memory addresses);
    function getAsset(uint256 assetId) external view returns (address tokenAddress, RWALib.AssetType assetType, uint64 deployedAt, bool active);
    function totalAssets() external view returns (uint256);
    function assetIdByAddress(address token) external view returns (uint256);
}