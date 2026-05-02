const { network } = require("hardhat");
const { verify } = require("../scripts/verify");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  log("----------------------------------------------------");
  log("Deploying CarbonToken implementation...");
  const FUNCTIONS_ROUTER = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De";
  const DON_ID = "0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000";
  const SUB_ID = 0;
  const carbonToken = await deploy("CarbonToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`CarbonToken implementation deployed at: ${carbonToken.address}`);
};
module.exports.tags = ["all", "carbon"];