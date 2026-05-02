pragma solidity ^0.8.20;
import { FunctionsClientUpgradeable } from "../core/FunctionsClientUpgradeable.sol";
import { FunctionsRequest }           from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { BaseRWAToken }               from "../core/BaseRWAToken.sol";
import { RWALib }                    from "../libraries/RWALib.sol";
contract PropertyToken is BaseRWAToken, FunctionsClientUpgradeable {
    using FunctionsRequest for FunctionsRequest.Request;
    uint64 public subscriptionId;
    bytes32 public donId;
    uint32 public callbackGasLimit;
    string public functionsSource;
    string public propertyId;
    bytes32 public pendingRequestId;
    bool public requestPending;
    event ValuationRequested(bytes32 indexed requestId);
    event ValuationFulfilled(bytes32 indexed requestId, uint256 valuation);
    event FunctionsError(bytes32 indexed requestId, bytes err);
    error UnexpectedRequestId(bytes32 expected, bytes32 received);
    function initialize(
        address asset_,
        address functionsRouter_,
        uint64 subscriptionId_,
        bytes32 donId_,
        uint32 callbackGasLimit_,
        string memory propertyId_,
        string memory functionsSource_,
        uint256 initialValuation_,
        uint256 yieldBPS_,
        address kycManager_,
        address admin_,
        string memory ipfsCID_
    ) external initializer {
        if (functionsRouter_ == address(0)) revert RWALib.ZeroAddress();
        __BaseRWAToken_init(
            "NexusRWA Property",
            "nxPROP",
            asset_,
            RWALib.AssetType.REAL_ESTATE,
            ipfsCID_,
            yieldBPS_,
            kycManager_,
            admin_
        );
        __FunctionsClient_init(functionsRouter_);
        subscriptionId   = subscriptionId_;
        donId            = donId_;
        callbackGasLimit = callbackGasLimit_ == 0 ? 300_000 : callbackGasLimit_;
        propertyId       = propertyId_;
        functionsSource  = functionsSource_;
        if (initialValuation_ > 0) {
            _updateValuation(initialValuation_);
        }
    }
    function requestValuationUpdate() external onlyOwner {
        if (requestPending) revert RWALib.RequestPending(pendingRequestId);
        if (
            _metadata.lastUpdated > 0 &&
            block.timestamp < _metadata.lastUpdated + RWALib.MIN_UPDATE_INTERVAL
        ) {
            revert RWALib.InvalidValuation(0);
        }
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(functionsSource);
        string[] memory args = new string[](1);
        args[0] = propertyId;
        req.setArgs(args);
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );
        pendingRequestId = requestId;
        requestPending   = true;
        emit ValuationRequested(requestId);
    }
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (requestId != pendingRequestId)
            revert UnexpectedRequestId(pendingRequestId, requestId);
        requestPending = false;
        pendingRequestId = bytes32(0);
        if (err.length > 0) {
            emit FunctionsError(requestId, err);
            return;
        }
        uint256 valuationCents = abi.decode(response, (uint256));
        uint256 valuationUSD18 = valuationCents * 1e16;
        _updateValuation(valuationUSD18);
        emit ValuationFulfilled(requestId, valuationUSD18);
    }
    function updateFunctionsSource(string calldata newSource) external onlyOwner {
        functionsSource = newSource;
    }
    function updateSubscriptionId(uint64 newSubId) external onlyOwner {
        subscriptionId = newSubId;
    }
    function updateCallbackGasLimit(uint32 newLimit) external onlyOwner {
        callbackGasLimit = newLimit;
    }
    function updatePropertyId(string calldata newPropertyId) external onlyOwner {
        propertyId = newPropertyId;
    }
    function setFunctionsRouter(address newRouter) external onlyOwner {
        _setFunctionsRouter(newRouter);
    }
}