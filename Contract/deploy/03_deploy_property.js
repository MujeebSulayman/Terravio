const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const FUNCTIONS_ROUTERS = {
  137:   "0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73D10",
  84532: "0xf9B8d898172181729416Ab6C8974d3b49C10BA72", // Base Sepolia
  31337: "0x0000000000000000000000000000000000000000",
};
const DON_IDS = {
  137:   ethers.encodeBytes32String("fun-polygon-mainnet-1"),
  84532: ethers.encodeBytes32String("fun-base-sepolia-1"),
  31337: ethers.encodeBytes32String("fun-hardhat-1"),
};
module.exports = async function ({ getNamedAccounts, deployments, network }) {
  const { save, get, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  const chainId = network.config.chainId;
  log("─────────────────────────────────────");
  log("Deploying PropertyToken");
  log("─────────────────────────────────────");
  const subscriptionId = process.env.CHAINLINK_SUBSCRIPTION_ID;
  if (!subscriptionId) {
    log("⚠️  CHAINLINK_SUBSCRIPTION_ID not set — using 0 (update after deploy)");
  }
  const jsSourcePath = path.join(
    __dirname,
    "../chainlink-functions/fetchPropertyValuation.js"
  );
  const functionsSource = fs.readFileSync(jsSourcePath, "utf8");
  const registryDeployment = await get("AssetRegistry");
  const registry = await ethers.getContractAt("AssetRegistry", registryDeployment.address);
  const usdcDeployment = await get("MockUSDC").catch(() => ({ address: ethers.ZeroAddress }));
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propImpl = await PropertyToken.deploy();
  await propImpl.waitForDeployment();
  const implAddress = await propImpl.getAddress();
  log(`PropertyToken Implementation: ${implAddress}`);
  const ASSET_TYPE_REAL_ESTATE = 1;
  const tx1 = await registry.registerImplementation(ASSET_TYPE_REAL_ESTATE, implAddress);
  await tx1.wait();
  const initData = PropertyToken.interface.encodeFunctionData("initialize", [
    usdcDeployment.address,
    FUNCTIONS_ROUTERS[chainId],
    BigInt(subscriptionId || 0),
    DON_IDS[chainId],
    0, // Use default gas limit (300,000) from RWALib
    "5500-Grand-Central-Pkwy-W-Garden-City-NY",
    functionsSource,
    ethers.parseUnits("500000", 18),
    800,
    kycManager,
    deployer,
    "bafybeiprop...",
  ]);
  const tx2 = await registry.deployAsset(ASSET_TYPE_REAL_ESTATE, initData);
  const receipt = await tx2.wait();
  const event = receipt.logs.find((l) => l.fragment?.name === "AssetDeployed");
  const cloneAddress = event?.args?.tokenAddress;
  log(`PropertyToken Clone: ${cloneAddress}`);
  log(`Asset ID:            ${event?.args?.assetId}`);
  log("");
  log("Next steps:");
  log("  1. Add clone as Chainlink Functions consumer in your subscription");
  log("     https://functions.chain.link");
  log("  2. Upload encrypted secrets (RealtyMole API key) to the DON");
  log("  3. Call requestValuationUpdate() to trigger first oracle fetch");
  await save("PropertyToken", {
    address: cloneAddress,
    abi: PropertyToken.interface.formatJson(),
  });
};
module.exports.tags = ["property", "all"];
module.exports.dependencies = ["registry"];