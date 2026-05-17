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
      // 1. Fetch off-chain registry from DB
      const dbAssets = await prisma.asset.findMany({
        where: {
          address: {
            not: null
          }
        }
      });

      // 2. Fetch live on-chain health data
      const onChainData = await service.getGlobalHealth();
      const onChainMap = new Map(onChainData.map((h) => [h.address.toLowerCase(), h]));

      // 3. Dynamically merge live on-chain data into the registry response
      const enrichedAssets = dbAssets.map((asset) => {
        const addr = (asset.address || "").toLowerCase();
        const onChain = onChainMap.get(addr);
        const hasOnChain = onChain && !("error" in onChain);
        const onChainData = hasOnChain ? (onChain as any) : null;
        
        return {
          id: asset.id,
          kind: asset.kind,
          externalId: asset.externalId,
          address: asset.address,
          name: onChainData ? onChainData.name : asset.name,
          symbol: onChainData ? onChainData.symbol : asset.symbol,
          status: onChainData ? onChainData.statusLabel : asset.status,
          quantity: asset.quantity,
          apy: onChainData ? parseFloat(onChainData.apyPercent) : (asset.apy ?? 0),
          assetType: asset.assetType,
          metadata: asset.metadata,
        };
      });

      res.json({ success: true, data: enrichedAssets });
    } catch (error) {
      console.error("[protocol/assets] Enriched Fetch Error:", error);
      next(error);
    }
  });


  router.get("/health", async (req, res, next) => {
    try {
      const health = await service.getGlobalHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      next(error);
    }
  });


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
