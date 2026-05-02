/**
 * 02_deploy_gold.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deploy GoldToken implementation + register with AssetRegistry
 *
 * Flow:
 *   1. Deploy GoldToken implementation (not a proxy — Registry clones it)
 *   2. Call AssetRegistry.registerImplementation(GOLD, impl)
 *   3. Call AssetRegistry.deployAsset(GOLD, initData) → deploys the actual clone
 *
 * Chainlink XAU/USD Feed Addresses:
 *   Polygon Mainnet : 0x0C466540B2ee1a31b441671eac0ca886e051E410
 *   Polygon Amoy    : Deploy a MockAggregator (see mocks/) for testnet
 *
 * Run:
 *   npx hardhat deploy --network amoy --tags gold
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { ethers } = require("hardhat");
const { RWALib_AssetType } = require("../scripts/constants");

// Chainlink XAU/USD feed addresses per network
const PRICE_FEEDS = {
  137:   "0x0C466540B2ee1a31b441671eac0ca886e051E410", // Polygon mainnet
  80002: "0x0000000000000000000000000000000000000000", // Amoy — replace with mock
  31337: "0x0000000000000000000000000000000000000000", // Hardhat — replace with mock
};

// USDC addresses per network (underlying ERC-4626 asset)
const USDC_ADDRESSES = {
  137:   "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon USDC
  80002: "0x0000000000000000000000000000000000000000", // Amoy test USDC
  31337: "0x0000000000000000000000000000000000000000", // Hardhat mock
};

module.exports = async function ({ getNamedAccounts, deployments, network }) {
  const { save, get, log } = deployments;
  const { deployer, kycManager } = await getNamedAccounts();

  const chainId = network.config.chainId;

  log("─────────────────────────────────────");
  log("Deploying GoldToken");
  log(`Network: ${network.name} (chainId: ${chainId})`);
  log("─────────────────────────────────────");

  // ── 1. Get registry ─────────────────────────────────────────
  const registryDeployment = await get("AssetRegistry");
  const registry = await ethers.getContractAt("AssetRegistry", registryDeployment.address);

  // ── 2. Deploy GoldToken IMPLEMENTATION (not proxy) ──────────
  const GoldToken = await ethers.getContractFactory("GoldToken");
  const goldImpl = await GoldToken.deploy();
  await goldImpl.waitForDeployment();
  const implAddress = await goldImpl.getAddress();

  log(`GoldToken Implementation: ${implAddress}`);

  // ── 3. Register implementation in AssetRegistry ─────────────
  // AssetType.GOLD = 0 (see RWALib enum)
  const ASSET_TYPE_GOLD = 0;
  const tx1 = await registry.registerImplementation(ASSET_TYPE_GOLD, implAddress);
  await tx1.wait();
  log("Registered GoldToken implementation");

  // ── 4. Encode initializer calldata for the clone ─────────────
  const priceFeedAddress = PRICE_FEEDS[chainId];
  const usdcAddress      = USDC_ADDRESSES[chainId];

  if (priceFeedAddress === "0x000...") {
    log("⚠️  WARNING: Using zero address for price feed — deploy a MockAggregator first");
  }

  const initData = GoldToken.interface.encodeFunctionData("initialize", [
    usdcAddress,          // asset_ (USDC)
    priceFeedAddress,     // priceFeed_ (Chainlink XAU/USD)
    ethers.parseUnits("1000", 0), // totalGoldGrams_ — 1000 grams
    0,                    // yieldBPS_ (gold has no yield)
    kycManager,           // kycManager_
    deployer,             // admin_
    "bafybeigold...",     // ipfsCID_ — replace with real IPFS CID
  ]);

  // ── 5. Deploy asset clone via Registry ───────────────────────
  const tx2 = await registry.deployAsset(ASSET_TYPE_GOLD, initData);
  const receipt = await tx2.wait();

  // Parse AssetDeployed event to get clone address
  const event = receipt.logs.find(
    (log) => log.fragment?.name === "AssetDeployed"
  );
  const cloneAddress = event?.args?.tokenAddress;

  log(`GoldToken Clone (active): ${cloneAddress}`);
  log(`Asset ID in Registry:     ${event?.args?.assetId}`);

  // Save clone address
  await save("GoldToken", {
    address: cloneAddress,
    abi: GoldToken.interface.formatJson(),
  });
};

module.exports.tags = ["gold", "all"];
module.exports.dependencies = ["registry"];
