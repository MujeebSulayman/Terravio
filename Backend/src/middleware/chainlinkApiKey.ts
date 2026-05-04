import type { Request, Response, NextFunction } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";

function extractBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || typeof h !== "string") return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1]! : null;
}

export function chainlinkApiKeyMiddleware(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const expected = env.TERRAVIO_API_KEY;
    if (!expected) {
      return next(new HttpError(503, "Oracle API not configured (TERRAVIO_API_KEY)", "oracle_unconfigured"));
    }
    const bearer = extractBearer(req);
    const headerKey = req.headers["x-terravio-api-key"];
    const apiKey =
      bearer ??
      (typeof headerKey === "string" ? headerKey : Array.isArray(headerKey) ? headerKey[0] : null);

    if (!apiKey || apiKey !== expected) {
      return next(new HttpError(401, "Invalid or missing API key", "unauthorized"));
    }
    next();
  };
}
