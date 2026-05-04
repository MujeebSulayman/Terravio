import type { User as PrivyUser } from "@privy-io/node";
import { prisma } from "../lib/prisma";
import { resolveWalletAddress } from "../lib/resolveWallet";

function pickEmail(user: PrivyUser): string | null {
  for (const a of user.linked_accounts) {
    if (a.type === "email") return a.address;
  }
  return null;
}

export async function upsertUserFromPrivy(privyUser: PrivyUser) {
  const wallet = resolveWalletAddress(privyUser);
  const email = pickEmail(privyUser);

  return prisma.user.upsert({
    where: { privyId: privyUser.id },
    create: {
      privyId: privyUser.id,
      email,
      walletAddress: wallet,
    },
    update: {
      email: email ?? undefined,
      walletAddress: wallet ?? undefined,
    },
  });
}
