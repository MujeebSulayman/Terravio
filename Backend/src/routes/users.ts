import { Router } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { requirePrivyAuth } from "../middleware/requirePrivyAuth";
import { prisma } from "../lib/prisma";
import { upsertUserFromPrivy } from "../services/userService";
import { BASE_RWA_WHITELIST_ABI } from "../abis/baseRWAToken";
import { getConfiguredRwaTokens } from "../lib/rwaTokens";
import { ethers } from "ethers";



export function usersRoutes(env: Env) {
  const r = Router();
  r.use(requirePrivyAuth(env));

  r.all("/me", async (req, res, next) => {
    try {
      const privyId = req.privyUserId;
      if (!privyId) {
        return next(new HttpError(401, "Not authenticated", "unauthorized"));
      }

      const { email, wallet } = req.body;

      let user;
      if (req.privyUser) {
        user = await upsertUserFromPrivy(req.privyUser);
      } else {
        // Use data from frontend if profile fetch failed
        user = await prisma.user.upsert({
          where: { privyId },
          create: { 
            privyId,
            email: email || undefined,
            walletAddress: wallet || undefined
          },
          update: {
            email: email || undefined,
            walletAddress: wallet || undefined
          }
        });
        console.log(`[User Service] Synced user from Frontend Data: ${user.id} (${email || 'No email'})`);
      }

      if (!user) {
        return next(new HttpError(404, "User not found", "not_found"));
      }

      let whitelistOnChain: Record<string, boolean> | undefined;
      if (user.walletAddress) {
        const tokens = getConfiguredRwaTokens(env);
        if (tokens.length > 0) {
          const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
          whitelistOnChain = {};
          for (const t of tokens) {
            try {
              const c = new ethers.Contract(t.address, BASE_RWA_WHITELIST_ABI, provider);
              whitelistOnChain[t.address] = Boolean(await c.isWhitelisted(user.walletAddress!));
            } catch {
              whitelistOnChain[t.address] = false;
            }
          }
        }
      }

      res.json({
        id: user.id,
        privyId: user.privyId,
        email: user.email,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
        whitelistOnChain,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
