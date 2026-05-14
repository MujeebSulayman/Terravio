import { ethers } from "ethers";
import type { Env } from "../config/env";
import { getConfiguredRwaTokens } from "../lib/rwaTokens";

const PROTOCOL_ABI = [
  {
    name: "getAssetMetadata",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "assetType",    type: "uint8"   },
          { name: "status",       type: "uint8"   },
          { name: "name",         type: "string"  },
          { name: "symbol",       type: "string"  },
          { name: "ipfsCID",      type: "string"  },
          { name: "valuationUSD", type: "uint256" },
          { name: "yieldBPS",     type: "uint256" },
          { name: "lastUpdated",  type: "uint64"  },
          { name: "totalIssuance",type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "depositYield",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "setAssetStatus",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "status", type: "uint8" }],
    outputs: [],
  },
] as const;

const ASSET_STATUS: Record<number, string> = {
  0: "PENDING",
  1: "ACTIVE",
  2: "PAUSED",
  3: "REDEEMED",
};

export class ProtocolService {
  private provider: ethers.JsonRpcProvider;
  private yieldSigner: ethers.Wallet;

  constructor(private env: Env) {
    this.provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL || "https://sepolia.base.org");
    if (!env.KYC_MANAGER_PRIVATE_KEY) {
      throw new Error("Missing KYC_MANAGER_PRIVATE_KEY for protocol administration");
    }
    this.yieldSigner = new ethers.Wallet(env.KYC_MANAGER_PRIVATE_KEY, this.provider);
  }


  async distributeYield(tokenAddress: string, amountUSD: number) {
    const amountInWei = ethers.parseUnits(amountUSD.toString(), 18);
    const contract = new ethers.Contract(tokenAddress, PROTOCOL_ABI, this.yieldSigner);

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

  async getGlobalHealth() {
    const tokens = getConfiguredRwaTokens(this.env);

    const health = await Promise.all(
      tokens.map(async (token) => {
        const contract = new ethers.Contract(token.address, PROTOCOL_ABI, this.provider);
        try {
          const metadata = await contract.getAssetMetadata();
          return {
            address:     token.address,
            name:        metadata.name,
            symbol:      metadata.symbol,
            status:      Number(metadata.status),
            statusLabel: ASSET_STATUS[Number(metadata.status)] || "UNKNOWN",
            valuation:   ethers.formatUnits(metadata.valuationUSD, 18),
            yieldBPS:    Number(metadata.yieldBPS),
            apyPercent:  (Number(metadata.yieldBPS) / 100).toFixed(2),
            totalIssuance: ethers.formatUnits(metadata.totalIssuance, 18),
            lastUpdated: metadata.lastUpdated > 0n
              ? new Date(Number(metadata.lastUpdated) * 1000).toISOString()
              : null,
          };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[ProtocolService] Failed to fetch metadata for ${token.address}:`, msg);
          return {
            address: token.address,
            error: "Contract call failed — contract may be uninitialized or RPC unavailable",
          };
        }
      })
    );

    return health;
  }
}
