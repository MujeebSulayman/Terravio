import { Router } from "express";
import type { Env } from "../config/env";
import { HttpError } from "../lib/errors";
import { chainlinkApiKeyMiddleware } from "../middleware/chainlinkApiKey";
import { getPropertyValuationById } from "../services/propertyOracleService";

/**
 * Response shape consumed by Contract/chainlink-functions/fetchPropertyValuation.js
 * (uses property.estimatedValueUSD).
 */
export function propertyOracleRoutes(env: Env) {
  const r = Router();
  r.use(chainlinkApiKeyMiddleware(env));

  r.get("/:id/valuation", async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) {
        return next(new HttpError(400, "Missing property id", "bad_request"));
      }

      const data = await getPropertyValuationById(id, env.RENTCAST_API_KEY);
      res.json(data);
    } catch (e) {
      console.error(`[propertyOracle] Error for ${req.params.id}:`, e);
      next(e);
    }
  });

  return r;
}
