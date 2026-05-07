# Terravio

Terravio is a comprehensive Real World Asset (RWA) protocol designed to tokenize, manage, and distribute yield for physical and off-chain assets including Gold, Real Estate, and Carbon Credits. The platform is built on the Base network and leverages Chainlink infrastructure to bridge real-world data securely on-chain.

## Project Structure

This repository is a monorepo organized into distinct services that make up the Terravio ecosystem:

* `/Contract`
  Contains the core Solidity smart contracts, deployment scripts, and Chainlink Functions configurations. The protocol utilizes the ERC4626 standard for yield-bearing RWA vaults and an upgradeable Minimal Proxy architecture for asset deployment. For contract-specific documentation and deployment instructions, see `Contract/README.md`.

* `/frontend`
  The user-facing web application that allows users to undergo KYC verification, browse available tokenized assets, invest, and claim generated yield. 

* `/Backend`
  The proprietary backend services responsible for off-chain administrative tasks, KYC verification processes, and maintaining the dynamic state and retirement status of complex assets like Carbon Credits.

* `/Architect`
  Contains system architecture diagrams, legacy migration scripts, and foundational planning documentation for the protocol.

## Key Technologies

* Blockchain: Base (Sepolia Testnet)
* Smart Contracts: Solidity, Hardhat, OpenZeppelin Upgrades
* Oracles: Chainlink Data Feeds (Price), Chainlink Functions (Off-chain API integration)
* Asset Tokenization: ERC4626, UUPS Proxies, ERC1167 Clones
* External Data Sources: RentCast API (Real Estate Valuations), TheGraph (Carbon Pricing)

## Getting Started

To run the Terravio protocol locally, each service must be initialized independently:

### 1. Smart Contracts
Navigate to the `/Contract` directory. Copy the `.env.example` to `.env` and provide your RPC URLs, Private Keys, and Oracle API credentials. Refer to the `Contract/README.md` for compilation and deployment commands.

### 2. Backend
Navigate to the `/Backend` directory. Copy the `.env.example` to `.env` to initialize the local server, database connections, and API endpoints required by the Chainlink Functions.

### 3. Frontend
Navigate to the `/frontend` directory, install the package dependencies, and spin up the development server to interact with your deployed contracts.
