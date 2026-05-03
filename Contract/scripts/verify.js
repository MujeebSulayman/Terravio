const { ethers, run, network, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Starting automated verification for ${network.name}...`);

  // 1. Load the deployment JSON
  const filePath = path.join(__dirname, `../deployment-output/${network.name}_addresses.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Could not find deployment file at ${filePath}`);
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const registryAddress = deploymentData.AssetRegistry;

  if (!registryAddress) {
    console.error("Error: AssetRegistry address not found in deployment data.");
    process.exit(1);
  }

  console.log(`Found AssetRegistry Proxy at: ${registryAddress}`);

  // 2. Connect to the AssetRegistry
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const registry = AssetRegistry.attach(registryAddress);

  // 3. Get the implementation addresses
  let registryImpl, goldImpl, propertyImpl, carbonImpl;
  try {
    // Get UUPS Proxy Implementation Address
    registryImpl = await upgrades.erc1967.getImplementationAddress(registryAddress);
    
    // Get Clone Implementation Addresses from the Registry
    goldImpl = await registry.implementations(0);     // ASSET_TYPE_GOLD = 0
    propertyImpl = await registry.implementations(1); // ASSET_TYPE_REAL_ESTATE = 1
    carbonImpl = await registry.implementations(2);   // ASSET_TYPE_CARBON_CREDIT = 2

    console.log("\n--- Implementation Addresses to Verify ---");
    console.log(`AssetRegistry Impl: ${registryImpl}`);
    console.log(`GoldToken Impl:     ${goldImpl}`);
    console.log(`PropertyToken Impl: ${propertyImpl}`);
    console.log(`CarbonToken Impl:   ${carbonImpl}`);
    console.log("------------------------------------------\n");
  } catch (error) {
    console.error("Error: Failed to fetch implementation addresses from the blockchain.");
    console.error(error);
    process.exit(1);
  }

  // 4. Helper function to verify
  async function verifyContract(name, address) {
    console.log(`Verifying ${name} at ${address}...`);
    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: [], // Our implementations don't have constructor args, they use initialize()
      });
      console.log(`Success: ${name} successfully verified!`);
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log(`Notice: ${name} is already verified!`);
      } else {
        console.error(`Error: Failed to verify ${name}:`, e.message);
      }
    }
  }

  // 5. Run Verification on all implementations
  await verifyContract("AssetRegistry Implementation", registryImpl);
  await verifyContract("GoldToken Implementation", goldImpl);
  await verifyContract("PropertyToken Implementation", propertyImpl);
  await verifyContract("CarbonToken Implementation", carbonImpl);

  console.log("\nCompleted: All smart contracts verified on Basescan!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });