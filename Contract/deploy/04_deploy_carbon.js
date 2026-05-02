const { network } = require("hardhat");
const { verify } = require("../scripts/verify");
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  log("----------------------------------------------------");
  log("Deploying CarbonToken implementation...");
  const FUNCTIONS_ROUTER = "0xf9B8d898172181729416Ab6C8974d3b49C10BA72";
  const DON_ID = "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000";
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