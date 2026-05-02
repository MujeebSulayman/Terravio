require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("dotenv").config();

/**
 * Hardhat Configuration — NexusRWA
 *
 * Networks:
 *   - hardhat    : Local in-memory network for fast unit tests
 *   - amoy       : Polygon Amoy testnet (primary deployment target)
 *   - polygon    : Polygon mainnet (production)
 *
 * Required .env variables:
 *   DEPLOYER_PRIVATE_KEY    — wallet that deploys contracts
 *   POLYGON_AMOY_RPC_URL    — e.g. from Alchemy or Infura
 *   POLYGONSCAN_API_KEY     — for contract verification
 */

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Required for complex inheritance with multiple bases
    },
  },

  networks: {
    // ── Local ──────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
      forking: {
        // Optional: fork Polygon mainnet for live Chainlink feed tests
        // url: process.env.POLYGON_MAINNET_RPC_URL,
        // blockNumber: 55000000,
        enabled: false,
      },
    },

    // ── Polygon Amoy Testnet ────────────────────────────────────
    amoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },

    // ── Polygon Mainnet ─────────────────────────────────────────
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
      chainId: 137,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },

  // ── Contract Verification ──────────────────────────────────────
  etherscan: {
    apiKey: {
      polygon:        process.env.POLYGONSCAN_API_KEY || "",
      polygonAmoy:    process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL:     "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },

  // ── Hardhat Deploy ─────────────────────────────────────────────
  namedAccounts: {
    deployer: { default: 0 },
    kycManager: { default: 1 },
  },

  // ── Gas Reporter (run with REPORT_GAS=true) ────────────────────
  gasReporter: {
    enabled:      process.env.REPORT_GAS === "true",
    currency:     "USD",
    coinmarketcap: process.env.CMC_API_KEY,
    token:        "MATIC",
  },
};
