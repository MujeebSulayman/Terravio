import type { Request, Response, NextFunction } from "express";
import { InvalidAuthTokenError } from "@privy-io/node";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { getPrivyClient } from "../lib/privy";

function extractBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || typeof h !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1]! : null;
}

export function requirePrivyAuth(env: Env) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (env.DEV_SKIP_AUTH && env.NODE_ENV === "development") {
      const devWallet = req.headers["x-dev-wallet"];
      const w =
        typeof devWallet === "string"
          ? devWallet
          : Array.isArray(devWallet)
            ? devWallet[0]
            : null;
      if (!w) {
        return next(
          new HttpError(
            400,
            "DEV_SKIP_AUTH requires X-Dev-Wallet header with an 0x address",
            "dev_auth"
          )
        );
      }
      req.privyUserId = `dev:${w}`;
      return next();
    }

    const token = extractBearer(req);
    if (!token) {
      return next(new HttpError(401, "Missing Authorization Bearer token", "unauthorized"));
    }

    const privy = getPrivyClient(env);
    if (!privy) {
      return next(new HttpError(500, "Privy is not configured", "privy_unconfigured"));
    }
    try {
      const claims = await (privy as any).utilsService._auth.verifyAccessToken(token);
      const userId = claims.userId || (claims as any).user_id;
      console.log("✅ Security: Token verified for", userId);
      req.privyUserId = userId;
      
      try {
        req.privyUser = await (privy as any).usersService.get(userId);
        console.log("✅ Profile: Fetched from Privy");
      } catch (err: any) {
        console.warn("⚠️ Profile: Fetch failed (using ID only):", err.message);
      }
    } catch (e: any) {
      console.error("❌ Security: Verification failed:", e.message);
      if (e instanceof InvalidAuthTokenError) {
        return next(new HttpError(401, "Invalid or expired token", "invalid_token"));
      }
      return next(e);
    }

    next();
  };
}
