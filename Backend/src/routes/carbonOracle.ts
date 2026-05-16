import { Router } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { chainlinkApiKeyMiddleware } from "../middleware/chainlinkApiKey";
import { getCarbonStatusByExternalId } from "../services/carbonOracleService";

/**
 * Response shape consumed by Contract/chainlink-functions/fetchCarbonData.js
 * (uses creditData.status and creditData.quantity).
 */
export function carbonOracleRoutes(env: Env) {
  const r = Router();
  r.use(chainlinkApiKeyMiddleware(env));

  r.get("/:id/status", async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) {
        return next(new HttpError(400, "Missing carbon id", "bad_request"));
      }

      const data = await getCarbonStatusByExternalId(id);
      if (!data) {
        return next(new HttpError(404, "Carbon asset not found", "not_found"));
      }

      res.json({ status: data.status, quantity: data.quantity });
    } catch (e) {
      console.error(`[carbonOracle] Error for ${req.params.id}:`, e);
      next(e);
    }
  });

  return r;
}
