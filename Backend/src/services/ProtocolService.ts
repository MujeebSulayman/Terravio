import { ethers } from "ethers";
import type { Env } from "../config/env";
import { BASE_RWA_WHITELIST_ABI } from "../abis/baseRWAToken"; // We can reuse this or create a full ABI
import { getConfiguredRwaTokens } from "../lib/rwaTokens";

// Full ABI for administrative functions
const PROTOCOL_ADMIN_ABI = [
  "function depositYield(uint256 amount) external",
  "function setAssetStatus(uint8 status) external",
  "function getAssetMetadata() external view returns (tuple(uint8 assetType, uint8 status, string name, string symbol, string ipfsCID, uint256 valuationUSD, uint256 yieldBPS, uint64 lastUpdated, uint256 totalIssuance))",
];

export class ProtocolService {
  private provider: ethers.JsonRpcProvider;
  private yieldSigner: ethers.Wallet;

  constructor(private env: Env) {
    this.provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL || "https://sepolia.base.org");
    if (!env.KYC_MANAGER_PRIVATE_KEY) {
      throw new Error("Missing KYC_MANAGER_PRIVATE_KEY for protocol administration");
    }
    // We'll reuse the KYC manager for now as the 'admin' for yield as well
    this.yieldSigner = new ethers.Wallet(env.KYC_MANAGER_PRIVATE_KEY, this.provider);
  }

  /**
   * Triggers a yield distribution for a specific RWA token.
   * In production, this would be called by a cron job or after a fiat payment confirmation.
   */
  async distributeYield(tokenAddress: string, amountUSD: number) {
    const amountInWei = ethers.parseUnits(amountUSD.toString(), 18);
    const contract = new ethers.Contract(tokenAddress, PROTOCOL_ADMIN_ABI, this.yieldSigner);

    console.log(`[ProtocolService] Distributing $${amountUSD} yield to ${tokenAddress}...`);
    
    try {
      const tx = await contract.depositYield(amountInWei);
      const receipt = await tx.wait();
      return { success: true, txHash: receipt.hash };
    } catch (error) {
      console.error(`[ProtocolService] Failed to distribute yield:`, error);
      throw error;
    }
  }

  /**
   * Fetches the current live status of all RWA tokens from the blockchain.
   */
  async getGlobalHealth() {
    const tokens = getConfiguredRwaTokens(this.env);
    const health = await Promise.all(tokens.map(async (token) => {
      const contract = new ethers.Contract(token.address, PROTOCOL_ADMIN_ABI, this.provider);
      try {
        const metadata = await contract.getAssetMetadata();
        return {
          address: token.address,
          name: metadata.name,
          status: metadata.status, // 0 = Inactive, 1 = Active, etc.
          valuation: ethers.formatUnits(metadata.valuationUSD, 18),
          lastUpdated: new Date(Number(metadata.lastUpdated) * 1000).toISOString()
        };
      } catch (e) {
        return { address: token.address, error: "Failed to fetch metadata" };
      }
    }));

    return health;
  }
}
