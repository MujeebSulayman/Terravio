// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { UUPSUpgradeable }          from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Clones }                    from "@openzeppelin/contracts/proxy/Clones.sol";
import { Initializable }             from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import { IRWAToken }   from "../interfaces/IRWAToken.sol";
import { RWALib }      from "../libraries/RWALib.sol";
import { GoldToken }   from "../tokens/GoldToken.sol";

/**
 * @title AssetRegistry
 * @author NexusRWA
 *
 * @notice Factory and on-chain registry for all NexusRWA tokenized assets.
 *
 * @dev Uses EIP-1167 Minimal Proxy (Clones) to deploy cheap copies of each
 *      implementation contract. Stores a registry of all deployed asset tokens.
 *
 * Standards:
 *   - EIP-1167  : Minimal proxy (Clones) for gas-efficient deployments
 *   - EIP-1967  : UUPS proxy for this registry itself
 *   - AccessControl : Role-based permission to register new asset types
 *
 * Roles:
 *   DEFAULT_ADMIN_ROLE : Can grant/revoke all roles, upgrade this contract
 *   ASSET_MANAGER_ROLE : Can register new implementations and deploy assets
 */
contract AssetRegistry is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using Clones for address;

    // ─────────────────────────────────────────────────────────
    // Roles
    // ─────────────────────────────────────────────────────────

    bytes32 public constant ASSET_MANAGER_ROLE = keccak256("ASSET_MANAGER_ROLE");

    // ─────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Info about a deployed asset token
     * @param tokenAddress  Address of the deployed clone/proxy
     * @param assetType     Asset classification
     * @param deployedAt    Block timestamp of deployment
     * @param active        Whether this asset is currently active
     */
    struct AssetRecord {
        address tokenAddress;
        RWALib.AssetType assetType;
        uint64 deployedAt;
        bool active;
    }

    /// @notice Implementation addresses for each asset type (set once, cloned many times)
    mapping(RWALib.AssetType => address) public implementations;

    /// @notice All deployed asset tokens, indexed by a unique ID
    mapping(uint256 => AssetRecord) public assets;

    /// @notice Total number of assets ever deployed
    uint256 public totalAssets;

    /// @notice Lookup: token address → asset ID
    mapping(address => uint256) public assetIdByAddress;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event ImplementationRegistered(RWALib.AssetType indexed assetType, address implementation);
    event AssetDeployed(
        uint256 indexed assetId,
        address indexed tokenAddress,
        RWALib.AssetType assetType,
        string name
    );
    event AssetDeactivated(uint256 indexed assetId, address tokenAddress);

    // ─────────────────────────────────────────────────────────
    // Initializer
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize the registry
     * @param admin Address that receives DEFAULT_ADMIN_ROLE and ASSET_MANAGER_ROLE
     */
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert RWALib.ZeroAddress();

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ASSET_MANAGER_ROLE, admin);
    }

    // ─────────────────────────────────────────────────────────
    // Implementation Registration
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Register an implementation contract for an asset type
     * @dev Called once per asset type with the deployed implementation address.
     *      Subsequent asset deployments clone this implementation cheaply (EIP-1167).
     * @param assetType      Asset type this implementation handles
     * @param implementation Address of the deployed implementation contract
     */
    function registerImplementation(
        RWALib.AssetType assetType,
        address implementation
    ) external onlyRole(ASSET_MANAGER_ROLE) {
        if (implementation == address(0)) revert RWALib.ZeroAddress();
        implementations[assetType] = implementation;
        emit ImplementationRegistered(assetType, implementation);
    }

    // ─────────────────────────────────────────────────────────
    // Asset Deployment
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new tokenized asset via EIP-1167 minimal proxy clone
     * @dev Clones the registered implementation for the given asset type,
     *      then calls the asset-specific initializer with the provided params.
     *
     * @param assetType   Type of asset to deploy
     * @param initData    ABI-encoded initializer calldata (asset-specific)
     * @return assetId    ID assigned to this asset in the registry
     * @return clone      Address of the deployed asset token contract
     */
    function deployAsset(
        RWALib.AssetType assetType,
        bytes calldata initData
    ) external onlyRole(ASSET_MANAGER_ROLE) returns (uint256 assetId, address clone) {
        address impl = implementations[assetType];
        if (impl == address(0)) revert RWALib.ZeroAddress();

        // EIP-1167: deploy a minimal proxy pointing to impl
        clone = impl.clone();

        // Initialize the clone with asset-specific params
        (bool success, ) = clone.call(initData);
        require(success, "AssetRegistry: init failed");

        // Register in storage
        assetId = ++totalAssets;
        assets[assetId] = AssetRecord({
            tokenAddress: clone,
            assetType:    assetType,
            deployedAt:   uint64(block.timestamp),
            active:       true
        });
        assetIdByAddress[clone] = assetId;

        // Read name from the deployed token for the event
        string memory assetName = IRWAToken(clone).getAssetMetadata().name;

        emit AssetDeployed(assetId, clone, assetType, assetName);
    }

    // ─────────────────────────────────────────────────────────
    // Registry Management
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Deactivate an asset (does not destroy, just flags inactive)
     * @param assetId ID of the asset to deactivate
     */
    function deactivateAsset(uint256 assetId) external onlyRole(ASSET_MANAGER_ROLE) {
        AssetRecord storage record = assets[assetId];
        require(record.tokenAddress != address(0), "AssetRegistry: not found");
        record.active = false;
        emit AssetDeactivated(assetId, record.tokenAddress);
    }

    // ─────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Get all active assets of a given type
     * @param assetType Asset type to filter by
     * @return addresses Array of active token addresses
     */
    function getAssetsByType(RWALib.AssetType assetType)
        external
        view
        returns (address[] memory addresses)
    {
        // Count first
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

    /**
     * @notice Get full record for an asset by ID
     * @param assetId Asset ID
     */
    function getAsset(uint256 assetId) external view returns (AssetRecord memory) {
        return assets[assetId];
    }

    // ─────────────────────────────────────────────────────────
    // UUPS Upgrade Authorization
    // ─────────────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
