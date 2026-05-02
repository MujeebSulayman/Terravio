// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ── OpenZeppelin Upgradeable ───────────────────────────────────────────────────
import { ERC20Upgradeable }            from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC4626Upgradeable }          from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { EIP712Upgradeable }           from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { OwnableUpgradeable }          from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { PausableUpgradeable }         from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable }  from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable }             from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ECDSA }                        from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IERC20 }                       from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ── Internal ───────────────────────────────────────────────────────────────────
import { IRWAToken }  from "../interfaces/IRWAToken.sol";
import { RWALib }     from "../libraries/RWALib.sol";

/**
 * @title BaseRWAToken
 * @author NexusRWA
 *
 * @notice Abstract base contract for all NexusRWA tokenized real-world assets.
 *
 * @dev Standards implemented:
 *   - ERC-20   : Fungible fractional shares
 *   - ERC-4626 : Tokenized vault standard (deposit/withdraw/yield)
 *   - EIP-712  : Typed structured data signing for off-chain KYC whitelist approvals
 *   - EIP-2612 : Permit (gasless approvals) — inherited via ERC20Permit (optional extension)
 *   - EIP-1967 : Proxy storage slots via UUPS
 *   - ERC-3643 : Partial — transfer whitelist enforcement (full T-REX adds on-chain identity registry)
 *
 * @dev Oracle update flow:
 *   Child contracts override `_updateValuationFromOracle()` to integrate either:
 *   (a) Chainlink Data Feeds  — GoldToken
 *   (b) Chainlink Functions   — PropertyToken, CarbonToken
 *
 * @dev Yield distribution:
 *   Simple per-share accrual model. Yield is distributed in the underlying asset token.
 *   Admin deposits yield into the contract; investors claim pro-rata based on their share balance.
 */
abstract contract BaseRWAToken is
    IRWAToken,
    ERC20Upgradeable,
    ERC4626Upgradeable,
    EIP712Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using ECDSA for bytes32;

    // ─────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────

    /// @notice Core asset metadata
    RWALib.AssetMetadata internal _metadata;

    /// @notice KYC whitelist — ERC-3643 style transfer restriction
    mapping(address => bool) internal _whitelist;

    /// @notice Address authorized to sign whitelist approvals (EIP-712)
    address public kycManager;

    /// @notice Yield accounting: reward per token accumulated so far (scaled 1e18)
    uint256 public rewardPerTokenStored;

    /// @notice Snapshot of rewardPerToken at last user interaction
    mapping(address => uint256) public userRewardPerTokenPaid;

    /// @notice Pending claimable rewards per user
    mapping(address => uint256) public rewards;

    /// @notice Total yield deposited into the contract by admin
    uint256 public totalYieldDeposited;

    // ─────────────────────────────────────────────────────────
    // Roles (bytes32 for gas efficiency vs strings)
    // ─────────────────────────────────────────────────────────

    bytes32 public constant ORACLE_ROLE  = keccak256("ORACLE_ROLE");
    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");

    // ─────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────

    /// @dev Reverts if caller or recipient is not on the KYC whitelist
    modifier onlyWhitelisted(address account) {
        if (!_whitelist[account]) revert RWALib.NotWhitelisted(account);
        _;
    }

    /// @dev Updates yield accrual for an account before any balance change
    modifier updateReward(address account) {
        rewardPerTokenStored = _rewardPerToken();
        if (account != address(0)) {
            rewards[account] = claimableYield(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    // ─────────────────────────────────────────────────────────
    // Initializer (replaces constructor for UUPS proxy)
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize the base token — called by child contract's initializer
     * @param name_         ERC-20 token name
     * @param symbol_       ERC-20 token symbol
     * @param asset_        Underlying ERC-20 asset for ERC-4626 vault (e.g. USDC)
     * @param assetType_    Enum: GOLD | REAL_ESTATE | CARBON_CREDIT
     * @param ipfsCID_      IPFS CID of the legal/supporting documents
     * @param yieldBPS_     Initial annual yield in basis points
     * @param kycManager_   Address allowed to sign KYC whitelist approvals
     * @param admin_        Initial owner of the contract
     */
    function __BaseRWAToken_init(
        string memory name_,
        string memory symbol_,
        address asset_,
        RWALib.AssetType assetType_,
        string memory ipfsCID_,
        uint256 yieldBPS_,
        address kycManager_,
        address admin_
    ) internal onlyInitializing {
        if (asset_ == address(0) || kycManager_ == address(0) || admin_ == address(0))
            revert RWALib.ZeroAddress();

        // EIP-712 domain — name and version used in signature verification
        __EIP712_init(name_, "1");
        __ERC20_init(name_, symbol_);
        __ERC4626_init(IERC20(asset_));
        __Ownable_init(admin_);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        kycManager = kycManager_;

        _metadata = RWALib.AssetMetadata({
            assetType:    assetType_,
            status:       RWALib.AssetStatus.PENDING,
            name:         name_,
            symbol:       symbol_,
            ipfsCID:      ipfsCID_,
            valuationUSD: 0,
            yieldBPS:     yieldBPS_,
            lastUpdated:  0,
            totalIssuance: 0
        });

        // Whitelist the admin by default
        _whitelist[admin_] = true;
    }

    // ─────────────────────────────────────────────────────────
    // IRWAToken — View Functions
    // ─────────────────────────────────────────────────────────

    /// @inheritdoc IRWAToken
    function getAssetMetadata() external view override returns (RWALib.AssetMetadata memory) {
        return _metadata;
    }

    /// @inheritdoc IRWAToken
    function getCurrentValuation() external view override returns (uint256) {
        return _metadata.valuationUSD;
    }

    /// @inheritdoc IRWAToken
    function getYieldRate() external view override returns (uint256) {
        return _metadata.yieldBPS;
    }

    /// @inheritdoc IRWAToken
    function isWhitelisted(address investor) external view override returns (bool) {
        return _whitelist[investor];
    }

    /// @inheritdoc IRWAToken
    function getAssetType() external view override returns (RWALib.AssetType) {
        return _metadata.assetType;
    }

    /**
     * @inheritdoc IRWAToken
     * @dev Yield = (rewardPerToken - paid) * balance + pending
     */
    function claimableYield(address investor) public view override returns (uint256) {
        return
            (balanceOf(investor) * (_rewardPerToken() - userRewardPerTokenPaid[investor])) /
            1e18 +
            rewards[investor];
    }

    // ─────────────────────────────────────────────────────────
    // IRWAToken — State-Changing Functions
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Whitelist an investor via an EIP-712 signed approval from the KYC manager
     * @dev The KYC manager signs off-chain; investor submits the signature on-chain.
     *      This avoids the admin paying gas for every KYC approval.
     *
     * EIP-712 typed data:
     *   WhitelistApproval(address investor, uint256 deadline)
     *
     * @param approval Struct containing investor address, deadline, and ECDSA signature
     */
    function whitelistInvestor(RWALib.WhitelistApproval calldata approval)
        external
        override
    {
        if (block.timestamp > approval.deadline)
            revert RWALib.SignatureExpired(approval.deadline, block.timestamp);

        // Reconstruct the EIP-712 digest
        bytes32 structHash = keccak256(
            abi.encode(RWALib.WHITELIST_TYPEHASH, approval.investor, approval.deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // Recover signer and verify it is the kycManager
        address signer = digest.recover(approval.v, approval.r, approval.s);
        if (signer != kycManager) revert RWALib.InvalidSignature();

        _whitelist[approval.investor] = true;
        emit InvestorWhitelisted(approval.investor);
    }

    /// @inheritdoc IRWAToken
    function removeFromWhitelist(address investor) external override onlyOwner {
        _whitelist[investor] = false;
        emit InvestorRemovedFromWhitelist(investor);
    }

    /**
     * @inheritdoc IRWAToken
     * @dev Uses nonReentrant to prevent reentrancy on the underlying asset transfer
     */
    function claimYield() external override nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward == 0) revert RWALib.ZeroAmount();

        rewards[msg.sender] = 0;

        // Transfer underlying asset (e.g. USDC) to investor
        IERC20(asset()).transfer(msg.sender, reward);
        emit YieldClaimed(msg.sender, reward);
    }

    /// @inheritdoc IRWAToken
    function updateIPFSCID(string calldata newCID) external override onlyOwner {
        _metadata.ipfsCID = newCID;
    }

    // ─────────────────────────────────────────────────────────
    // Yield Admin
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Admin deposits yield (in underlying asset) to be distributed to token holders
     * @dev Admin must approve this contract to spend the underlying asset first
     * @param amount Amount of underlying asset tokens to deposit as yield
     */
    function depositYield(uint256 amount) external onlyOwner updateReward(address(0)) {
        if (amount == 0) revert RWALib.ZeroAmount();
        if (totalSupply() == 0) revert RWALib.ZeroAmount(); // no holders yet

        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        totalYieldDeposited += amount;

        // Distribute yield per token
        rewardPerTokenStored += (amount * 1e18) / totalSupply();
    }

    /**
     * @notice Update annual yield rate (in basis points)
     * @param newYieldBPS New yield rate e.g. 800 = 8%
     */
    function setYieldRate(uint256 newYieldBPS) external onlyOwner {
        emit YieldRateUpdated(_metadata.yieldBPS, newYieldBPS);
        _metadata.yieldBPS = newYieldBPS;
    }

    // ─────────────────────────────────────────────────────────
    // Oracle Update — implemented by child contracts
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Internal hook — child contracts override this to integrate their oracle
     * @dev Called by the oracle role or Chainlink Functions callback
     * @param newValuationUSD New valuation in USD (18 decimals)
     */
    function _updateValuation(uint256 newValuationUSD) internal virtual {
        if (newValuationUSD == 0) revert RWALib.InvalidValuation(newValuationUSD);

        uint256 old = _metadata.valuationUSD;
        _metadata.valuationUSD = newValuationUSD;
        _metadata.lastUpdated  = uint64(block.timestamp);

        if (_metadata.status == RWALib.AssetStatus.PENDING) {
            _metadata.status = RWALib.AssetStatus.ACTIVE;
        }

        emit ValuationUpdated(old, newValuationUSD, uint64(block.timestamp));
    }

    // ─────────────────────────────────────────────────────────
    // ERC-3643 Style Transfer Restriction
    // ─────────────────────────────────────────────────────────

    /**
     * @dev Override ERC-20 transfer to enforce whitelist
     *      Implements partial ERC-3643: both sender and recipient must be whitelisted
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable) updateReward(from) {
        // Allow minting (from == 0) and burning (to == 0) without whitelist check
        if (from != address(0) && to != address(0)) {
            if (!_whitelist[from]) revert RWALib.NotWhitelisted(from);
            if (!_whitelist[to])   revert RWALib.NotWhitelisted(to);
        }

        // Update reward snapshot for recipient too
        if (to != address(0)) {
            rewards[to] = claimableYield(to);
            userRewardPerTokenPaid[to] = rewardPerTokenStored;
        }

        super._update(from, to, amount);

        // Track total issuance
        if (from == address(0)) _metadata.totalIssuance += amount;
        if (to == address(0))   _metadata.totalIssuance -= amount;
    }

    // ─────────────────────────────────────────────────────────
    // Pause
    // ─────────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─────────────────────────────────────────────────────────
    // ERC-4626 Overrides — enforce pause + whitelist
    // ─────────────────────────────────────────────────────────

    function deposit(uint256 assets, address receiver)
        public override whenNotPaused onlyWhitelisted(receiver) returns (uint256)
    {
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver)
        public override whenNotPaused onlyWhitelisted(receiver) returns (uint256)
    {
        return super.mint(shares, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner_)
        public override whenNotPaused returns (uint256)
    {
        return super.withdraw(assets, receiver, owner_);
    }

    // ─────────────────────────────────────────────────────────
    // UUPS Upgrade Authorization
    // ─────────────────────────────────────────────────────────

    /// @dev Only owner can authorize upgrades (EIP-1967 / UUPS pattern)
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ─────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────

    /// @dev Calculates accumulated reward per token
    function _rewardPerToken() internal view returns (uint256) {
        return rewardPerTokenStored;
    }

    // ─────────────────────────────────────────────────────────
    // ERC-165 Interface Detection
    // ─────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IRWAToken).interfaceId;
    }

    // ─────────────────────────────────────────────────────────
    // Required overrides for multiple inheritance
    // ─────────────────────────────────────────────────────────

    function decimals()
        public pure override(ERC20Upgradeable, ERC4626Upgradeable)
        returns (uint8)
    {
        return 18;
    }

    function name()
        public view override(ERC20Upgradeable)
        returns (string memory)
    {
        return _metadata.name;
    }

    function symbol()
        public view override(ERC20Upgradeable)
        returns (string memory)
    {
        return _metadata.symbol;
    }
}
