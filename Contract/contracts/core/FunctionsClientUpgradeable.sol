// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IFunctionsRouter }  from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";
import { IFunctionsClient }  from "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";
import { FunctionsRequest } from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import { Initializable }    from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title FunctionsClientUpgradeable
 * @notice Upgradeable version of Chainlink's FunctionsClient
 */
abstract contract FunctionsClientUpgradeable is IFunctionsClient, Initializable {
    using FunctionsRequest for FunctionsRequest.Request;

    /// @notice Address of the Chainlink Functions Router
    address private _router;

    error OnlyRouterCanFulfill();

    /**
     * @notice Initialize the client with the router address
     * @param router_ Address of the Functions Router
     */
    function __FunctionsClient_init(address router_) internal onlyInitializing {
        _router = router_;
    }

    /**
     * @notice Returns the current router address
     */
    function getFunctionsRouter() public view returns (address) {
        return _router;
    }

    /**
     * @notice Internal function to send a request to the DON
     */
    function _sendRequest(
        bytes memory data,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        bytes32 donId
    ) internal returns (bytes32) {
        return IFunctionsRouter(_router).sendRequest(
            subscriptionId,
            data,
            FunctionsRequest.REQUEST_DATA_VERSION,
            callbackGasLimit,
            donId
        );
    }

    /**
     * @notice Chainlink Functions callback entry point
     */
    function handleOracleFulfillment(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external override {
        if (msg.sender != _router) revert OnlyRouterCanFulfill();
        fulfillRequest(requestId, response, err);
    }

    /**
     * @notice Internal hook to be implemented by the child contract
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal virtual;

    /**
     * @notice Update the router address (if needed during upgrade)
     */
    function _setFunctionsRouter(address router_) internal {
        _router = router_;
    }
}
