pragma solidity ^0.8.31;
import { ERC20Upgradeable }            from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC4626Upgradeable }          from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { EIP712Upgradeable }           from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import { OwnableUpgradeable }          from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { PausableUpgradeable }         from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { ReentrancyGuardUpgradeable }  from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable }             from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { SignatureChecker }         from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import { ECDSA }                    from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IERC20 }                       from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata }               from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IRWAToken }  from "../interfaces/IRWAToken.sol";
import { RWALib }     from "../libraries/RWALib.sol";
abstract contract BaseRWAToken is
    IRWAToken,
    IERC20Metadata,
    ERC20Upgradeable,
    ERC4626Upgradeable,
    EIP712Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    using ECDSA for bytes32;
    RWALib.AssetMetadata internal _metadata;
    mapping(address => bool) internal _whitelist;
    address public kycManager;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    uint256 public totalYieldDeposited;
    bytes32 public constant ORACLE_ROLE  = keccak256("ORACLE_ROLE");
    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");
    modifier onlyWhitelisted(address account) {
        if (!_whitelist[account]) revert RWALib.NotWhitelisted(account);
        _;
    }
    modifier updateReward(address account) {
        rewardPerTokenStored = _rewardPerToken();
        if (account != address(0)) {
            rewards[account] = claimableYield(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
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
        _whitelist[admin_] = true;
    }
    function getAssetMetadata() external view override returns (RWALib.AssetMetadata memory) {
        return _metadata;
    }
    function getCurrentValuation() external view override returns (uint256) {
        return _metadata.valuationUSD;
    }
    function getYieldRate() external view override returns (uint256) {
        return _metadata.yieldBPS;
    }
    function isWhitelisted(address investor) external view override returns (bool) {
        return _whitelist[investor];
    }
    function getAssetType() external view override returns (RWALib.AssetType) {
        return _metadata.assetType;
    }
    function claimableYield(address investor) public view override returns (uint256) {
        return
            (balanceOf(investor) * (_rewardPerToken() - userRewardPerTokenPaid[investor])) /
            1e18 +
            rewards[investor];
    }
    function whitelistInvestor(RWALib.WhitelistApproval calldata approval)
        external
        override
    {
        if (block.timestamp > approval.deadline)
            revert RWALib.SignatureExpired(approval.deadline, block.timestamp);

        bytes32 structHash = keccak256(
            abi.encode(RWALib.WHITELIST_TYPEHASH, approval.investor, approval.deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        
        bool isValid = SignatureChecker.isValidSignatureNow(
            kycManager,
            digest,
            approval.signature
        );
        
        if (!isValid) revert RWALib.InvalidSignature();

        _whitelist[approval.investor] = true;
        emit InvestorWhitelisted(approval.investor);
    }
    function removeFromWhitelist(address investor) external override onlyOwner {
        _whitelist[investor] = false;
        emit InvestorRemovedFromWhitelist(investor);
    }

    function setKycManager(address newManager) external onlyOwner {
        if (newManager == address(0)) revert RWALib.ZeroAddress();
        kycManager = newManager;
    }
    function claimYield() external override nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward == 0) revert RWALib.ZeroAmount();
        rewards[msg.sender] = 0;
        IERC20(asset()).transfer(msg.sender, reward);
        emit YieldClaimed(msg.sender, reward);
    }
    function updateIPFSCID(string calldata newCID) external override onlyOwner {
        _metadata.ipfsCID = newCID;
    }
    function depositYield(uint256 amount) external onlyOwner updateReward(address(0)) {
        if (amount == 0) revert RWALib.ZeroAmount();
        if (totalSupply() == 0) revert RWALib.ZeroAmount();
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
        totalYieldDeposited += amount;
        rewardPerTokenStored += (amount * 1e18) / totalSupply();
    }
    function setYieldRate(uint256 newYieldBPS) external onlyOwner {
        emit YieldRateUpdated(_metadata.yieldBPS, newYieldBPS);
        _metadata.yieldBPS = newYieldBPS;
    }
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
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Upgradeable) updateReward(from) {
        if (from != address(0) && to != address(0)) {
            if (!_whitelist[from]) revert RWALib.NotWhitelisted(from);
            if (!_whitelist[to])   revert RWALib.NotWhitelisted(to);
        }
        if (to != address(0)) {
            rewards[to] = claimableYield(to);
            userRewardPerTokenPaid[to] = rewardPerTokenStored;
        }
        super._update(from, to, amount);
        if (from == address(0)) _metadata.totalIssuance += amount;
        if (to == address(0))   _metadata.totalIssuance -= amount;
    }
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
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
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    function _rewardPerToken() internal view returns (uint256) {
        return rewardPerTokenStored;
    }
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IRWAToken).interfaceId;
    }
    function decimals()
        public pure override(ERC20Upgradeable, ERC4626Upgradeable, IERC20Metadata)
        returns (uint8)
    {
        return 18;
    }
    function name()
        public view override(ERC20Upgradeable, IERC20Metadata)
        returns (string memory)
    {
        return _metadata.name;
    }
    function symbol()
        public view override(ERC20Upgradeable, IERC20Metadata)
        returns (string memory)
    {
        return _metadata.symbol;
    }
}