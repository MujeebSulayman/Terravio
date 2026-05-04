import { Router } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { requirePrivyAuth } from "../middleware/requirePrivyAuth";
import { prisma } from "../lib/prisma";
import { upsertUserFromPrivy } from "../services/userService";
import { BASE_RWA_WHITELIST_ABI } from "../abis/baseRWAToken";
import { getConfiguredRwaTokens } from "../lib/rwaTokens";
import { ethers } from "ethers";

const DEFAULT_RPC = "https://sepolia.base.org";

export function usersRoutes(env: Env) {
  const r = Router();
  r.use(requirePrivyAuth(env));

  r.get("/me", async (req, res, next) => {
    try {
      const privyId = req.privyUserId;
      if (!privyId) {
        return next(new HttpError(401, "Not authenticated", "unauthorized"));
      }

      let user;
      if (env.DEV_SKIP_AUTH && env.NODE_ENV === "development" && privyId.startsWith("dev:")) {
        const wallet = privyId.slice(4);
        user = await prisma.user.upsert({
          where: { privyId },
          create: { privyId, walletAddress: wallet },
          update: { walletAddress: wallet },
        });
      } else if (req.privyUser) {
        user = await upsertUserFromPrivy(req.privyUser);
      } else {
        user = await prisma.user.findUnique({ where: { privyId } });
      }

      if (!user) {
        return next(new HttpError(404, "User not found", "not_found"));
      }

      let whitelistOnChain: Record<string, boolean> | undefined;
      if (user.walletAddress) {
        const tokens = getConfiguredRwaTokens(env);
        if (tokens.length > 0) {
          const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL ?? DEFAULT_RPC);
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
