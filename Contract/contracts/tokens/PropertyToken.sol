// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FunctionsClientUpgradeable } from "../core/FunctionsClientUpgradeable.sol";
import { FunctionsRequest }           from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { BaseRWAToken }               from "../core/BaseRWAToken.sol";
import { RWALib }                    from "../libraries/RWALib.sol";

/**
 * @title PropertyToken
 * @author NexusRWA
 *
 * @notice Tokenized real estate property. Fractional ownership of a specific
 *         physical property. Valuation is fetched via Chainlink Functions from
 *         the RealtyMole property API.
 *
 * @dev Standards:
 *   - Inherits BaseRWAToken (ERC-20, ERC-4626, EIP-712, UUPS)
 *   - FunctionsClientUpgradeable (standardized for proxies)
 *   - Automated updates via Chainlink Automation (optional — call requestValuationUpdate manually)
 *
 * @dev How Chainlink Functions works here:
 *   1. Owner/Automation calls requestValuationUpdate()
 *   2. Chainlink DON executes fetchPropertyValuation.js (stored in chainlink-functions/)
 *   3. JS script fetches RealtyMole API, returns encoded uint256 valuation
 *   4. Chainlink calls fulfillRequest() on this contract with the result
 *   5. _updateValuation() is called, storage is updated
 *
 * @dev Chainlink Functions Router on Polygon Amoy:
 *   0xC22a79eBA640940ABB6dF0f7982cc119578E11De
 *
 * @dev DON ID for Polygon Amoy: fun-polygon-amoy-1
 */
contract PropertyToken is BaseRWAToken, FunctionsClientUpgradeable {
    using FunctionsRequest for FunctionsRequest.Request;

    // ─────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────

    /// @notice Chainlink Functions subscription ID (created at functions.chain.link)
    uint64 public subscriptionId;

    /// @notice Chainlink DON ID (bytes32 encoded) e.g. fun-polygon-amoy-1
    bytes32 public donId;

    /// @notice Gas limit for the Chainlink Functions callback
    uint32 public callbackGasLimit;

    /// @notice The JavaScript source code to run in Chainlink DON
    /// @dev Stored on-chain so it can be updated without redeployment
    string public functionsSource;

    /// @notice Property identifier passed as argument to the JS script
    /// @dev e.g. a RealtyMole property ID or address hash
    string public propertyId;

    /// @notice Tracks the pending Chainlink Functions request ID
    bytes32 public pendingRequestId;

    /// @notice Whether a Chainlink Functions request is in-flight
    bool public requestPending;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event ValuationRequested(bytes32 indexed requestId);
    event ValuationFulfilled(bytes32 indexed requestId, uint256 valuation);
    event FunctionsError(bytes32 indexed requestId, bytes err);

    // ─────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────

    error UnexpectedRequestId(bytes32 expected, bytes32 received);

    // ─────────────────────────────────────────────────────────
    // Initializer
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize the PropertyToken
     * @param asset_             Underlying ERC-20 (e.g. USDC)
     * @param functionsRouter_   Chainlink Functions Router address on this network
     * @param subscriptionId_    Chainlink Functions subscription ID
     * @param donId_             DON ID (bytes32) for this network
     * @param callbackGasLimit_  Gas limit for the fulfillRequest callback (default: 300_000)
     * @param propertyId_        Off-chain property identifier for the JS script
     * @param functionsSource_   JavaScript source code to run in Chainlink DON
     * @param initialValuation_  Initial USD valuation (18 decimals) — set before first oracle update
     * @param yieldBPS_          Annual rental yield in basis points
     * @param kycManager_        Address that signs whitelist approvals
     * @param admin_             Contract owner
     * @param ipfsCID_           IPFS CID of property legal docs
     */
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

        // Initialize the upgradeable Functions client
        __FunctionsClient_init(functionsRouter_);

        subscriptionId   = subscriptionId_;
        donId            = donId_;
        callbackGasLimit = callbackGasLimit_ == 0 ? 300_000 : callbackGasLimit_;
        propertyId       = propertyId_;
        functionsSource  = functionsSource_;

        // Set initial valuation manually (before first Chainlink request resolves)
        if (initialValuation_ > 0) {
            _updateValuation(initialValuation_);
        }
    }

    // ─────────────────────────────────────────────────────────
    // Chainlink Functions — Request
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Trigger an off-chain valuation fetch via Chainlink Functions
     * @dev Can be called manually by owner, or automated via Chainlink Automation.
     *      Enforces minimum update interval to prevent spam.
     *
     * The JS script (functionsSource) receives `propertyId` as args[0] and
     * returns an ABI-encoded uint256 representing the property valuation in USD cents
     * (we convert to 18 decimals in fulfillRequest).
     */
    function requestValuationUpdate() external onlyOwner {
        if (requestPending) revert RWALib.RequestPending(pendingRequestId);

        // Enforce minimum interval between updates
        if (
            _metadata.lastUpdated > 0 &&
            block.timestamp < _metadata.lastUpdated + RWALib.MIN_UPDATE_INTERVAL
        ) {
            revert RWALib.InvalidValuation(0); // reuse error — "too soon"
        }

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(functionsSource);

        // Pass propertyId as argument to the JS script (accessed as args[0])
        string[] memory args = new string[](1);
        args[0] = propertyId;
        req.setArgs(args);

        // Send the request to the Chainlink DON
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

    // ─────────────────────────────────────────────────────────
    // Chainlink Functions — Callback
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Called by Chainlink DON after the JS script completes
     *
     * @param requestId  Must match pendingRequestId
     * @param response   ABI-encoded uint256 — valuation in USD cents (from JS script)
     * @param err        Non-empty if the JS script failed
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (requestId != pendingRequestId)
            revert UnexpectedRequestId(pendingRequestId, requestId);

        requestPending = false;
        pendingRequestId = bytes32(0);

        // Handle oracle script error
        if (err.length > 0) {
            emit FunctionsError(requestId, err);
            return;
        }

        // Decode the response — JS script returns uint256 (USD cents, 2 decimals)
        uint256 valuationCents = abi.decode(response, (uint256));

        // Convert cents to 18-decimal USD: cents * 1e16
        uint256 valuationUSD18 = valuationCents * 1e16;

        _updateValuation(valuationUSD18);

        emit ValuationFulfilled(requestId, valuationUSD18);
    }

    // ─────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────

    /// @notice Update the JS source code (e.g. to point to a different API endpoint)
    function updateFunctionsSource(string calldata newSource) external onlyOwner {
        functionsSource = newSource;
    }

    /// @notice Update the Chainlink Functions subscription ID
    function updateSubscriptionId(uint64 newSubId) external onlyOwner {
        subscriptionId = newSubId;
    }

    /// @notice Update the callback gas limit
    function updateCallbackGasLimit(uint32 newLimit) external onlyOwner {
        callbackGasLimit = newLimit;
    }

    /// @notice Update the property identifier
    function updatePropertyId(string calldata newPropertyId) external onlyOwner {
        propertyId = newPropertyId;
    }

    /// @notice Update the Functions Router (emergency)
    function setFunctionsRouter(address newRouter) external onlyOwner {
        _setFunctionsRouter(newRouter);
    }
}
