const { ethers } = require("hardhat");
const { RWALib_AssetType } = require("../scripts/constants");
const PRICE_FEEDS = {
  84532: "0xa877c413b0A78a6321287c2B3C2A9678120e5E53", // Base Sepolia XAU/USD
  31337: "0x0000000000000000000000000000000000000000",
};
const USDC_ADDRESSES = {
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
  31337: "0x0000000000000000000000000000000000000000",
};
module.exports = async function ({ getNamedAccounts, deployments, network }) {
  const { save, get, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  const chainId = network.config.chainId;
  log("─────────────────────────────────────");
  log("Deploying GoldToken");
  log(`Network: ${network.name} (chainId: ${chainId})`);
  log("─────────────────────────────────────");
  const registryDeployment = await get("AssetRegistry");
  const registry = await ethers.getContractAt("AssetRegistry", registryDeployment.address);
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const goldImpl = await GoldToken.deploy();
  await goldImpl.waitForDeployment();
  const implAddress = await goldImpl.getAddress();
  log(`GoldToken Implementation: ${implAddress}`);
  const ASSET_TYPE_GOLD = 0;
  const tx1 = await registry.registerImplementation(ASSET_TYPE_GOLD, implAddress);
  await tx1.wait();
  log("Registered GoldToken implementation");
  const priceFeedAddress = PRICE_FEEDS[chainId];
  const usdcAddress      = USDC_ADDRESSES[chainId];
  if (priceFeedAddress === "0x000...") {
    log("⚠️  WARNING: Using zero address for price feed — deploy a MockAggregator first");
  }
  const initData = GoldToken.interface.encodeFunctionData("initialize", [
    usdcAddress,
    priceFeedAddress,
    ethers.parseUnits("1000", 0),
    0,
    kycManager,
    deployer,
    "bafybeigold...",
  ]);
  const tx2 = await registry.deployAsset(ASSET_TYPE_GOLD, initData);
  const receipt = await tx2.wait();
  const event = receipt.logs.find(
    (log) => log.fragment?.name === "AssetDeployed"
  );
  const cloneAddress = event?.args?.tokenAddress;
  log(`GoldToken Clone (active): ${cloneAddress}`);
  log(`Asset ID in Registry:     ${event?.args?.assetId}`);
  await save("GoldToken", {
    address: cloneAddress,
    abi: GoldToken.interface.formatJson(),
  });
};
module.exports.tags = ["gold", "all"];
module.exports.dependencies = ["registry"];