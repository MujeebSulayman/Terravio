import { Router } from "express";
import { ProtocolService } from "../services/ProtocolService";
import type { Env } from "../config/env";
import { prisma } from "../lib/prisma";

export const protocolRoutes = (env: Env) => {
  const router = Router();
  const service = new ProtocolService(env);

  /**
   * GET /api/protocol/assets
   * Returns all RWA token metadata from the off-chain database.
   */
  router.get("/assets", async (req, res, next) => {
    try {
      const assets = await prisma.asset.findMany();
      res.json({ success: true, data: assets });
    } catch (error) {
      console.error("[protocol/assets] DB Fetch Error:", error);
      next(error);
    }
  });

  /**
   * GET /api/protocol/health
   * Returns the live on-chain status of all RWA tokens.
   */
  router.get("/health", async (req, res, next) => {
    try {
      const health = await service.getGlobalHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/protocol/distribute-yield
   * Manual trigger for yield distribution (Admin Only)
   */
  router.post("/distribute-yield", async (req, res, next) => {
    const { tokenAddress, amountUSD } = req.body;
    
    if (!tokenAddress || !amountUSD) {
      return res.status(400).json({ success: false, error: "Missing tokenAddress or amountUSD" });
    }

    try {
      const result = await service.distributeYield(tokenAddress, amountUSD);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
