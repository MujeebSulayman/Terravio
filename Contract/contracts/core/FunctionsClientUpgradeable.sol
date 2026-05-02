pragma solidity ^0.8.31;
import {IFunctionsRouter} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/interfaces/IFunctionsRouter.sol";
import {IFunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/interfaces/IFunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_X/libraries/FunctionsRequest.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract FunctionsClientUpgradeable is
    IFunctionsClient,
    Initializable
{
    using FunctionsRequest for FunctionsRequest.Request;
    address private _router;
    error OnlyRouterCanFulfill();

    function __FunctionsClient_init(address router_) internal onlyInitializing {
        _router = router_;
    }

    function getFunctionsRouter() public view returns (address) {
        return _router;
    }

    function _sendRequest(
        bytes memory data,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        bytes32 donId
    ) internal returns (bytes32) {
        return
            IFunctionsRouter(_router).sendRequest(
                subscriptionId,
                data,
                FunctionsRequest.REQUEST_DATA_VERSION,
                callbackGasLimit,
                donId
            );
    }

    function handleOracleFulfillment(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external override {
        if (msg.sender != _router) revert OnlyRouterCanFulfill();
        fulfillRequest(requestId, response, err);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal virtual;

    function _setFunctionsRouter(address router_) internal {
        _router = router_;
    }
}
