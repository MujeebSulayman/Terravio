/**
 * 03_deploy_property.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deploy PropertyToken implementation + register with AssetRegistry
 *
 * Prerequisites:
 *   1. Create a Chainlink Functions subscription at https://functions.chain.link
 *   2. Fund it with LINK tokens (min 2 LINK for Amoy tests)
 *   3. Set CHAINLINK_SUBSCRIPTION_ID in .env
 *   4. Upload secrets (RealtyMole API key) using Chainlink Functions toolkit
 *   5. Read the JS source from chainlink-functions/fetchPropertyValuation.js
 *
 * Chainlink Functions Router (Polygon Amoy):
 *   0xC22a79eBA640940ABB6dF0f7982cc119578E11De
 *
 * Run:
 *   npx hardhat deploy --network amoy --tags property
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const FUNCTIONS_ROUTERS = {
  137:   "0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73D10", // Polygon mainnet
  80002: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De", // Polygon Amoy
  31337: "0x0000000000000000000000000000000000000000", // Hardhat mock
};

// DON IDs (bytes32 encoded)
const DON_IDS = {
  137:   ethers.encodeBytes32String("fun-polygon-mainnet-1"),
  80002: ethers.encodeBytes32String("fun-polygon-amoy-1"),
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

  // Read JS source from file
  const jsSourcePath = path.join(
    __dirname,
    "../chainlink-functions/fetchPropertyValuation.js"
  );
  const functionsSource = fs.readFileSync(jsSourcePath, "utf8");

  // ── 1. Get registry ─────────────────────────────────────────
  const registryDeployment = await get("AssetRegistry");
  const registry = await ethers.getContractAt("AssetRegistry", registryDeployment.address);

  const usdcDeployment = await get("MockUSDC").catch(() => ({ address: ethers.ZeroAddress }));

  // ── 2. Deploy PropertyToken IMPLEMENTATION ───────────────────
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propImpl = await PropertyToken.deploy();
  await propImpl.waitForDeployment();
  const implAddress = await propImpl.getAddress();

  log(`PropertyToken Implementation: ${implAddress}`);

  // ── 3. Register implementation ───────────────────────────────
  const ASSET_TYPE_REAL_ESTATE = 1;
  const tx1 = await registry.registerImplementation(ASSET_TYPE_REAL_ESTATE, implAddress);
  await tx1.wait();

  // ── 4. Encode init data ──────────────────────────────────────
  const initData = PropertyToken.interface.encodeFunctionData("initialize", [
    usdcDeployment.address,                        // asset_
    FUNCTIONS_ROUTERS[chainId],                    // functionsRouter_
    BigInt(subscriptionId || 0),                   // subscriptionId_
    DON_IDS[chainId],                              // donId_
    300_000,                                       // callbackGasLimit_
    "5500-Grand-Central-Pkwy-W-Garden-City-NY",    // propertyId_ — RealtyMole ID
    functionsSource,                               // functionsSource_ (full JS)
    ethers.parseUnits("500000", 18),               // initialValuation_ ($500,000)
    800,                                           // yieldBPS_ (8% rental yield)
    kycManager,                                    // kycManager_
    deployer,                                      // admin_
    "bafybeiprop...",                              // ipfsCID_
  ]);

  // ── 5. Deploy clone ──────────────────────────────────────────
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
