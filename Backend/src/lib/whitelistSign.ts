import { ethers } from "ethers";
import type { RwaTokenConfig } from "./rwaTokens";

const WHITELIST_TYPES: Record<string, { name: string; type: string }[]> = {
  WhitelistApproval: [
    { name: "investor", type: "address" },
    { name: "deadline", type: "uint256" },
  ],
};

export function buildWhitelistDomain(token: RwaTokenConfig, chainId: number) {
  return {
    name: token.eip712Name,
    version: "1",
    chainId,
    verifyingContract: token.address,
  };
}

export async function signWhitelistApproval(
  signer: ethers.Wallet,
  token: RwaTokenConfig,
  chainId: number,
  investor: string,
  deadline: bigint
): Promise<string> {
  const domain = buildWhitelistDomain(token, chainId);
  const value = { investor, deadline };
  const signature = await signer.signTypedData(domain, WHITELIST_TYPES, value);
  return signature;
}
