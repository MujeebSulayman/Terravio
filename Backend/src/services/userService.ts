import type { User as PrivyUser } from "@privy-io/server-auth";
import { prisma } from "../lib/prisma";
import { resolveWalletAddress } from "../lib/resolveWallet";

export async function upsertUserFromPrivy(privyUser: PrivyUser) {
  const wallet = resolveWalletAddress(privyUser);
  const email = privyUser.email?.address ?? null;

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
