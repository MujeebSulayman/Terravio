const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  84532: {
    usdc: process.env.USDC_ADDRESS || "",
    goldPriceFeed: process.env.GOLD_PRICE_FEED || "",
    functionsRouter: process.env.CHAINLINK_FUNCTIONS_ROUTER || "",
    donId: process.env.CHAINLINK_DON_ID || "",
  },
  31337: {
    usdc: ethers.ZeroAddress,
    goldPriceFeed: ethers.ZeroAddress,
    functionsRouter: ethers.ZeroAddress,
    donId: "0x0000000000000000000000000000000000000000",
  }
};

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { save, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const netConfig = CONFIG[chainId];

  if (!netConfig) {
    throw new Error(`Configuration not found for chainId: ${chainId}`);
  }

  log(`Deploying Terravio Protocol on ${network.name}...`);
  log(`Deployer: ${deployer}`);

  // 1. Deploy AssetRegistry
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const registry = await upgrades.deployProxy(AssetRegistry, [deployer], {
    kind: "uups",
    initializer: "initialize",
  });
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  log(`AssetRegistry: ${registryAddress}`);
  await save("AssetRegistry", { address: registryAddress, abi: AssetRegistry.interface.formatJson() });

  // 2. Deploy GoldToken
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const goldImpl = await GoldToken.deploy();
  await goldImpl.waitForDeployment();
  const goldImplAddr = await goldImpl.getAddress();
  await registry.registerImplementation(0, goldImplAddr); // ASSET_TYPE_GOLD = 0
  
  const goldInitData = GoldToken.interface.encodeFunctionData("initialize", [
    netConfig.usdc,
    netConfig.goldPriceFeed,
    ethers.parseUnits("1000", 0),
    0,
    kycManager,
    deployer,
    "bafybeigold...",
  ]);
  const txGold = await registry.deployAsset(0, goldInitData);
  const receiptGold = await txGold.wait();
  const goldClone = receiptGold.logs.find(l => l.fragment?.name === "AssetDeployed").args.tokenAddress;
  log(`GoldToken:     ${goldClone}`);
  await save("GoldToken", { address: goldClone, abi: GoldToken.interface.formatJson() });

  // 3. Deploy PropertyToken
  const subId = process.env.CHAINLINK_SUBSCRIPTION_ID || 0;
  const propSource = fs.readFileSync(path.join(__dirname, "../chainlink-functions/fetchPropertyValuation.js"), "utf8");
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propImpl = await PropertyToken.deploy();
  await propImpl.waitForDeployment();
  const propImplAddr = await propImpl.getAddress();
  await registry.registerImplementation(1, propImplAddr); // ASSET_TYPE_REAL_ESTATE = 1

  const propInitData = PropertyToken.interface.encodeFunctionData("initialize", [
    netConfig.usdc,
    netConfig.functionsRouter,
    BigInt(subId),
    netConfig.donId,
    0,
    "5500-Grand-Central-Pkwy-W-Garden-City-NY",
    propSource,
    ethers.parseUnits("500000", 18),
    800,
    kycManager,
    deployer,
    "bafybeiprop...",
  ]);
  const txProp = await registry.deployAsset(1, propInitData);
  const receiptProp = await txProp.wait();
  const propClone = receiptProp.logs.find(l => l.fragment?.name === "AssetDeployed").args.tokenAddress;
  log(`PropertyToken: ${propClone}`);
  await save("PropertyToken", { address: propClone, abi: PropertyToken.interface.formatJson() });

  // 4. Deploy CarbonToken
  const carbSource = fs.readFileSync(path.join(__dirname, "../chainlink-functions/fetchCarbonData.js"), "utf8");
  const CarbonToken = await ethers.getContractFactory("CarbonToken");
  const carbImpl = await CarbonToken.deploy();
  await carbImpl.waitForDeployment();
  const carbImplAddr = await carbImpl.getAddress();
  await registry.registerImplementation(2, carbImplAddr); // ASSET_TYPE_CARBON_CREDIT = 2

  const carbInitData = CarbonToken.interface.encodeFunctionData("initialize", [
    netConfig.usdc,
    netConfig.functionsRouter,
    BigInt(subId),
    netConfig.donId,
    0,
    "VCS-191-AMAZON-REDD",
    ethers.parseUnits("5000", 0),
    carbSource,
    ethers.parseUnits("70000", 18),
    500,
    kycManager,
    deployer,
    "bafybeicarbon...",
  ]);
  const txCarb = await registry.deployAsset(2, carbInitData);
  const receiptCarb = await txCarb.wait();
  const carbClone = receiptCarb.logs.find(l => l.fragment?.name === "AssetDeployed").args.tokenAddress;
  log(`CarbonToken:   ${carbClone}`);
  await save("CarbonToken", { address: carbClone, abi: CarbonToken.interface.formatJson() });

  log("All assets successfully deployed and registered.");
};

module.exports.tags = ["all"];
