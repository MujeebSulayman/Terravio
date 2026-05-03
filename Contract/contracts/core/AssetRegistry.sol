pragma solidity ^0.8.31;
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { UUPSUpgradeable }          from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Clones }                    from "@openzeppelin/contracts/proxy/Clones.sol";
import { Initializable }             from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IRWAToken }   from "../interfaces/IRWAToken.sol";
import { RWALib }      from "../libraries/RWALib.sol";
import { GoldToken }   from "../tokens/GoldToken.sol";
contract AssetRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using Clones for address;
    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");
    struct AssetRecord {
        address tokenAddress;
        RWALib.AssetType assetType;
        uint64 deployedAt;
        bool active;
    }
    mapping(RWALib.AssetType => address) public implementations;
    mapping(uint256 => AssetRecord) public assets;
    uint256 public totalAssets;
    mapping(address => uint256) public assetIdByAddress;
    event ImplementationRegistered(RWALib.AssetType indexed assetType, address implementation);
    event AssetDeployed(
        uint256 indexed assetId,
        address indexed tokenAddress,
        RWALib.AssetType assetType,
        string name
    );
    event AssetDeactivated(uint256 indexed assetId, address tokenAddress);
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert RWALib.ZeroAddress();
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ASSET_MANAGER_ROLE, admin);
    }
    function registerImplementation(
        RWALib.AssetType assetType,
        address implementation
    ) external onlyRole(ASSET_MANAGER_ROLE) {
        if (implementation == address(0)) revert RWALib.ZeroAddress();
        implementations[assetType] = implementation;
        emit ImplementationRegistered(assetType, implementation);
    }
    function deployAsset(
        RWALib.AssetType assetType,
        bytes calldata initData
    ) external onlyRole(ASSET_MANAGER_ROLE) returns (uint256 assetId, address clone) {
        address impl = implementations[assetType];
        if (impl == address(0)) revert RWALib.ZeroAddress();
        clone = impl.clone();
        (bool success, ) = clone.call(initData);
        if (!success) revert RWALib.InitializationFailed();
        assetId = ++totalAssets;
        assets[assetId] = AssetRecord({
            tokenAddress: clone,
            assetType:    assetType,
            deployedAt:   uint64(block.timestamp),
            active:       true
        });
        assetIdByAddress[clone] = assetId;
        string memory assetName = IRWAToken(clone).getAssetMetadata().name;
        emit AssetDeployed(assetId, clone, assetType, assetName);
    }
    function deactivateAsset(uint256 assetId) external onlyRole(ASSET_MANAGER_ROLE) {
        AssetRecord storage record = assets[assetId];
        if (record.tokenAddress == address(0)) revert RWALib.AssetNotFound(assetId);
        record.active = false;
        emit AssetDeactivated(assetId, record.tokenAddress);
    }
    function getAssetsByType(RWALib.AssetType assetType)
        external
        view
        returns (address[] memory addresses)
    {
        uint256 count;
        for (uint256 i = 1; i <= totalAssets; i++) {
            if (assets[i].assetType == assetType && assets[i].active) count++;
        }
        addresses = new address[](count);
        uint256 idx;
        for (uint256 i = 1; i <= totalAssets; i++) {
            if (assets[i].assetType == assetType && assets[i].active) {
                addresses[idx++] = assets[i].tokenAddress;
            }
        }
    }
    function getAsset(uint256 assetId) external view returns (AssetRecord memory) {
        return assets[assetId];
    }
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}