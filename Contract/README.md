# Terravio Protocol Smart Contracts

Terravio is a Real World Asset (RWA) protocol designed to tokenize, manage, and distribute yield for physical and off-chain assets including Gold, Real Estate, and Carbon Credits. The protocol relies on Chainlink infrastructure for secure, off-chain data integration.

## Architecture Overview

The system is built on a hub-and-spoke architecture utilizing the ERC4626 standard for yield-bearing tokens and OpenZeppelin Upgrades for maintainability.

### Core Components

* AssetRegistry
The central UUPS upgradeable contract that manages all tokenized assets. It acts as a factory using the Minimal Proxy (ERC1167) pattern to deploy and track individual asset clones (Gold, Property, Carbon). It enforces deployment standards and maintains the global registry of active assets.

* BaseRWAToken
The foundational ERC4626 vault implementation inherited by all asset types. It handles core logic including KYC/whitelist enforcement via a dedicated manager role, paused states, internal valuation tracking, and yield distribution mechanics.

* GoldToken
An implementation of BaseRWAToken that integrates directly with Chainlink Data Feeds (AggregatorV3Interface) to continuously sync the on-chain valuation with the real-world price of gold.

* PropertyToken
A real estate implementation that uses Chainlink Functions to securely query off-chain Automated Valuation Models (AVMs) via the RentCast API to determine the underlying property's current market value.

* CarbonToken
A carbon credit implementation that uses Chainlink Functions to verify credit retirement status against the Terravio backend and fetches dynamic pricing data from TheGraph to determine the net value of the active credits.

## Prerequisites

* Node.js (v18 or higher recommended)
* NPM or Yarn
* A configured `.env` file

### Environment Variables

Copy `.env.example` to `.env` and populate the required fields:

* BASE_SEPOLIA_RPC_URL: RPC endpoint for the Base Sepolia testnet.
* DEPLOYER_PRIVATE_KEY: Private key for the deployment account.
* USDC_ADDRESS: Address of the base currency (USDC) on the target network.
* CHAINLINK_DON_ID: Decentralized Oracle Network ID for Chainlink Functions.
* CHAINLINK_FUNCTIONS_ROUTER: Chainlink Functions router address on the target network.
* CHAINLINK_SUBSCRIPTION_ID: Active Chainlink billing subscription ID.
* RENTCAST_API_KEY: Authentication key for property valuations.

## Installation

Install all Hardhat and OpenZeppelin dependencies:

```sh
npm install
```

## Compilation

The protocol uses Solidity 0.8.31 and the IR optimizer.

```sh
npx hardhat compile
```

## Testing and Deployment

### Local Simulation

To simulate the off-chain Chainlink Functions logic without deploying to a network:

```sh
node chainlink-functions/testFunctions.js
```

### Network Deployment

The deployment script handles the sequential deployment of the AssetRegistry proxy, implementation registrations, and the cloning of the initial Gold, Property, and Carbon assets.

To deploy to the Base Sepolia testnet:

```sh
npx hardhat deploy --network baseSepolia
```

Upon successful deployment, the script will automatically generate a JSON artifact containing all relevant contract addresses in the `deployment-output/` directory.

## Security and Access Control

The protocol implements strict role-based access control (RBAC):
* DEFAULT_ADMIN_ROLE: Can upgrade the registry and update oracle feeds.
* ASSET_MANAGER_ROLE: Can register new asset implementations and deploy new clones.
* KYC_MANAGER_ROLE: Can whitelist addresses for deposits, minting, and yield claiming.
* PAUSER_ROLE: Can pause or unpause token interactions in emergency situations.
