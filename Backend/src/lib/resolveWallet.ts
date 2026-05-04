import type { User } from "@privy-io/server-auth";

/**
 * Prefer Privy's primary linked wallet; fall back to first ethereum wallet in linkedAccounts.
 */
export function resolveWalletAddress(user: User): string | null {
  const direct = user.wallet?.address;
  if (direct) return direct;

  const smart = user.smartWallet?.address;
  if (smart) return smart;

  for (const acc of user.linkedAccounts ?? []) {
    if (acc.type === "wallet" && acc.chainType === "ethereum") {
      return acc.address;
    }
    if (acc.type === "smart_wallet") {
      return acc.address;
    }
  }

  return null;
}
