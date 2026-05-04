import { ethers } from "ethers";
import type { Env } from "../config/env";
import { BASE_RWA_WHITELIST_ABI } from "../abis/baseRWAToken";
import { getConfiguredRwaTokens } from "../lib/rwaTokens";
import { signWhitelistApproval } from "../lib/whitelistSign";
import { prisma } from "../lib/prisma";

const DEFAULT_RPC = "https://sepolia.base.org";

export type WhitelistOneResult = {
  tokenAddress: string;
  txHash?: string;
  error?: string;
};

export async function whitelistWalletOnAllTokens(
  env: Env,
  walletAddress: string,
  userId: string | null,
  deadlineSecondsFromNow = 3600n
): Promise<WhitelistOneResult[]> {
  if (!env.KYC_MANAGER_PRIVATE_KEY) {
    throw new Error("KYC_MANAGER_PRIVATE_KEY is not configured");
  }

  const tokens = getConfiguredRwaTokens(env);
  if (tokens.length === 0) {
    throw new Error("No RWA token addresses configured");
  }

  const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL ?? DEFAULT_RPC);
  const signer = new ethers.Wallet(env.KYC_MANAGER_PRIVATE_KEY, provider);
  const investor = ethers.getAddress(walletAddress);
  const deadline = BigInt(Math.floor(Date.now() / 1000)) + deadlineSecondsFromNow;

  const results: WhitelistOneResult[] = [];

  for (const token of tokens) {
    const signature = await signWhitelistApproval(signer, token, env.CHAIN_ID, investor, deadline);
    const contract = new ethers.Contract(token.address, BASE_RWA_WHITELIST_ABI, signer);

    const pending = await prisma.whitelistSubmission.create({
      data: {
        userId,
        walletAddress: investor,
        tokenAddress: token.address,
        status: "pending",
      },
    });

    try {
      const tx = await contract.whitelistInvestor({
        investor,
        deadline,
        signature,
      });
      const receipt = await tx.wait();
      await prisma.whitelistSubmission.update({
        where: { id: pending.id },
        data: {
          txHash: receipt?.hash ?? tx.hash,
          status: "confirmed",
        },
      });
      results.push({ tokenAddress: token.address, txHash: receipt?.hash ?? tx.hash });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await prisma.whitelistSubmission.update({
        where: { id: pending.id },
        data: {
          status: "failed",
          errorMessage: message.slice(0, 2000),
        },
      });
      results.push({ tokenAddress: token.address, error: message });
    }
  }

  return results;
}
