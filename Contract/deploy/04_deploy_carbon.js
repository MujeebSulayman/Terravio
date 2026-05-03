const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const FUNCTIONS_ROUTERS = {
  84532: "0xf9B8d898172181729416Ab6C8974d3b49C10BA72",
};
const DON_IDS = {
  84532: "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000",
};
const USDC_ADDRESSES = {
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

module.exports = async function ({ getNamedAccounts, deployments, network }) {
  const { save, get, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  const chainId = network.config.chainId;

  log(`Deploying CarbonToken on ${network.name}...`);

  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    log("Warning: CHAINLINK_SUBSCRIPTION_ID not set");
  }

  const jsSourcePath = path.join(
    __dirname,
    "../chainlink-functions/fetchCarbonData.js"
  );
  const functionsSource = fs.readFileSync(jsSourcePath, "utf8");

  const registryDeployment = await get("AssetRegistry");
  const registry = await ethers.getContractAt("AssetRegistry", registryDeployment.address);

  const CarbonToken = await ethers.getContractFactory("CarbonToken");
  const carbonImpl = await CarbonToken.deploy();
  await carbonImpl.waitForDeployment();
  const implAddress = await carbonImpl.getAddress();

  log(`CarbonToken implementation registered`);

  const ASSET_TYPE_CARBON_CREDIT = 2;
  await registry.registerImplementation(ASSET_TYPE_CARBON_CREDIT, implAddress);

  const initData = CarbonToken.interface.encodeFunctionData("initialize", [
    USDC_ADDRESSES[chainId],
    FUNCTIONS_ROUTERS[chainId],
    BigInt(subscriptionId || 0),
    DON_IDS[chainId],
    0, // Default gas limit from RWALib
    "VCS-191-AMAZON-REDD",
    ethers.parseUnits("5000", 0), // 5000 Tonnes
    functionsSource,
    ethers.parseUnits("70000", 18), // $70,000 Initial Valuation
    500, // 5% yield
    kycManager,
    deployer,
    "bafybeicarbon...",
  ]);

  const tx = await registry.deployAsset(ASSET_TYPE_CARBON_CREDIT, initData);
  const receipt = await tx.wait();
  const event = receipt.logs.find((l) => l.fragment?.name === "AssetDeployed");
  const cloneAddress = event?.args?.tokenAddress;

  log(`CarbonToken deployed: ${cloneAddress}`);
  log("");
  log("Note: Add consumer to subscription and upload secrets before requesting valuation updates.");

  await save("CarbonToken", {
    address: cloneAddress,
    abi: CarbonToken.interface.formatJson(),
  });
};

module.exports.tags = ["carbon", "all"];
module.exports.dependencies = ["registry"];