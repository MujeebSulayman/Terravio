// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { FunctionsClientUpgradeable } from "../core/FunctionsClientUpgradeable.sol";
import { FunctionsRequest }           from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { BaseRWAToken }               from "../core/BaseRWAToken.sol";
import { RWALib }                    from "../libraries/RWALib.sol";

/**
 * @title CarbonToken
 * @author NexusRWA
 *
 * @notice Tokenized ESG asset representing carbon credits.
 *         Valuation is fetched via Chainlink Functions from the Verra Registry
 *         (aggregated via NexusRWA backend) and KlimaDAO price indexes.
 *
 * @dev Standards:
 *   - Inherits BaseRWAToken (ERC-20, ERC-4626, EIP-712, UUPS)
 *   - FunctionsClientUpgradeable (standardized for proxies)
 *
 * @dev How Chainlink Functions works here:
 *   1. Owner calls requestValuationUpdate()
 *   2. Chainlink DON executes fetchCarbonData.js
 *   3. JS script fetches carbon credit price and verification status
 *   4. Chainlink calls fulfillRequest() on this contract
 *   5. _updateValuation() is called, state updated
 */
contract CarbonToken is BaseRWAToken, FunctionsClientUpgradeable {
    using FunctionsRequest for FunctionsRequest.Request;
    using Strings for uint256;

    // ─────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────

    uint64 public subscriptionId;
    bytes32 public donId;
    uint32 public callbackGasLimit;
    string public functionsSource;

    /// @notice Unique identifier for the carbon credit batch (e.g. Verra VCU ID)
    string public carbonTokenId;

    /// @notice Total quantity in tonnes this token represents (for valuation scaling)
    uint256 public quantityTonnes;

    bytes32 public pendingRequestId;
    bool public requestPending;

    // ─────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────

    event ValuationRequested(bytes32 indexed requestId);
    event ValuationFulfilled(bytes32 indexed requestId, uint256 valuation);
    event FunctionsError(bytes32 indexed requestId, bytes err);

    error UnexpectedRequestId(bytes32 expected, bytes32 received);

    // ─────────────────────────────────────────────────────────
    // Initializer
    // ─────────────────────────────────────────────────────────

    /**
     * @notice Initialize the CarbonToken
     */
    function initialize(
        address asset_,
        address functionsRouter_,
        uint64 subscriptionId_,
        bytes32 donId_,
        uint32 callbackGasLimit_,
        string memory carbonTokenId_,
        uint256 quantityTonnes_,
        string memory functionsSource_,
        uint256 initialValuation_,
        uint256 yieldBPS_,
        address kycManager_,
        address admin_,
        string memory ipfsCID_
    ) external initializer {
        if (functionsRouter_ == address(0)) revert RWALib.ZeroAddress();

        __BaseRWAToken_init(
            "NexusRWA Carbon",
            "nxCRBN",
            asset_,
            RWALib.AssetType.CARBON_CREDIT,
            ipfsCID_,
            yieldBPS_,
            kycManager_,
            admin_
        );

        __FunctionsClient_init(functionsRouter_);

        subscriptionId   = subscriptionId_;
        donId            = donId_;
        callbackGasLimit = callbackGasLimit_ == 0 ? 300_000 : callbackGasLimit_;
        carbonTokenId    = carbonTokenId_;
        quantityTonnes   = quantityTonnes_;
        functionsSource  = functionsSource_;

        if (initialValuation_ > 0) {
            _updateValuation(initialValuation_);
        }
    }

    // ─────────────────────────────────────────────────────────
    // Chainlink Functions
    // ─────────────────────────────────────────────────────────

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

        string[] memory args = new string[](2);
        args[0] = carbonTokenId;
        args[1] = quantityTonnes.toString();
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

        // JS script returns total valuation in USD cents
        uint256 totalValuationCents = abi.decode(response, (uint256));
        uint256 totalValuationUSD18 = totalValuationCents * 1e16;

        _updateValuation(totalValuationUSD18);

        emit ValuationFulfilled(requestId, totalValuationUSD18);
    }

    // ─────────────────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────────────────

    function updateFunctionsSource(string calldata newSource) external onlyOwner {
        functionsSource = newSource;
    }

    function updateCarbonDetails(string calldata newTokenId, uint256 newQuantity) external onlyOwner {
        carbonTokenId = newTokenId;
        quantityTonnes = newQuantity;
    }

    function setFunctionsRouter(address newRouter) external onlyOwner {
        _setFunctionsRouter(newRouter);
    }
}
