/**
 * 01_deploy_registry.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deploy AssetRegistry behind a UUPS proxy (EIP-1967)
 *
 * Uses @openzeppelin/hardhat-upgrades to:
 *   1. Deploy the implementation contract
 *   2. Deploy an ERC1967Proxy pointing to it
 *   3. Call initialize() on the proxy
 *
 * Run:
 *   npx hardhat deploy --network amoy --tags registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { ethers, upgrades } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { save, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("─────────────────────────────────────");
  log("Deploying AssetRegistry (UUPS Proxy)");
  log(`Deployer: ${deployer}`);
  log("─────────────────────────────────────");

  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");

  // deployProxy handles: implementation deploy + proxy deploy + initialize call
  const registry = await upgrades.deployProxy(
    AssetRegistry,
    [deployer], // initialize(admin) args
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await registry.waitForDeployment();

  const proxyAddress = await registry.getAddress();
  const implAddress  = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  log(`AssetRegistry Proxy:          ${proxyAddress}`);
  log(`AssetRegistry Implementation: ${implAddress}`);

  // Save to hardhat-deploy artifacts for later scripts to reference
  await save("AssetRegistry", {
    address: proxyAddress,
    abi: AssetRegistry.interface.formatJson(),
  });

  return proxyAddress;
};

module.exports.tags = ["registry", "all"];
