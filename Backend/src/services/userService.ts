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
    if (user.privyId !== privyUser.id) {
      console.log(`[User Service] Merging account for email ${email}: Linking Privy ID ${privyUser.id} to existing User ${user.id}`);
    } else {
      console.log(`[User Service] Syncing returning user: ${user.id} (${email || 'No email'})`);
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        privyId: privyUser.id,
        email: email ?? undefined,
        walletAddress: wallet ?? undefined,
      },
    });
  }

  // 4. Create brand new user if no match at all
  console.log(`[User Service] Creating NEW user for Privy ID: ${privyUser.id} (${email || 'No email'})`);
  return prisma.user.create({
    data: {
      privyId: privyUser.id,
      email,
      walletAddress: wallet,
    },
  });
}
