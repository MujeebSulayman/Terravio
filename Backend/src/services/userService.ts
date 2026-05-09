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

  // 1. Try to find by privyId first
  let user = await prisma.user.findUnique({
    where: { privyId: privyUser.id }
  });

  // 2. If not found by privyId, but we have an email, try to find by email
  if (!user && email) {
    user = await prisma.user.findFirst({
      where: { email }
    });
  }

  // 3. Upsert based on whatever we found (or create new)
  if (user) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        privyId: privyUser.id, // Update privyId in case we matched by email
        email: email ?? undefined,
        walletAddress: wallet ?? undefined,
      },
    });
  }

  // 4. Create brand new user if no match at all
  return prisma.user.create({
    data: {
      privyId: privyUser.id,
      email,
      walletAddress: wallet,
    },
  });
}
