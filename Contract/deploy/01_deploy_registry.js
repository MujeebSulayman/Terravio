const { ethers, upgrades } = require("hardhat");
module.exports = async function ({ getNamedAccounts, deployments }) {
  const { save, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("Deploying AssetRegistry Proxy...");
  log(`Deployer: ${deployer}`);
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const registry = await upgrades.deployProxy(
    AssetRegistry,
    [deployer],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );
  await registry.waitForDeployment();
  const proxyAddress = await registry.getAddress();
  const implAddress  = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  log(`AssetRegistry: ${proxyAddress}`);
  await save("AssetRegistry", {
    address: proxyAddress,
    abi: AssetRegistry.interface.formatJson(),
  });
  return proxyAddress;
};
module.exports.tags = ["registry", "all"];