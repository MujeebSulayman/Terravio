import { ethers } from "ethers";
import type { RwaTokenConfig } from "./rwaTokens";

const WHITELIST_TYPES = {
  WhitelistApproval: [
    { name: "investor", type: "address" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

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
  // ethers v6: sign typed data (EIP-712)
  const signature = await signer.signTypedData(domain, WHITELIST_TYPES, value);
  return signature;
}
