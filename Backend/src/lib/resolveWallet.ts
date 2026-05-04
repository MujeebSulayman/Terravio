import type { User } from "@privy-io/node";

/**
 * Prefer smart wallet, then first Ethereum-linked wallet (`@privy-io/node` user shape).
 */
export function resolveWalletAddress(user: User): string | null {
  for (const acc of user.linked_accounts) {
    if (acc.type === "smart_wallet") return acc.address;
  }
  for (const acc of user.linked_accounts) {
    if (acc.type === "wallet" && acc.chain_type === "ethereum") return acc.address;
  }
  return null;
}
