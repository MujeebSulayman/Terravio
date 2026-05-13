import { Router } from "express";
import { ProtocolService } from "../services/ProtocolService";
import type { Env } from "../config/env";
import { prisma } from "../lib/prisma";

// Canonical token registry — mirrors Frontend/lib/constants.ts
const KNOWN_TOKENS = [
  {
    kind: "gold",
    externalId: "lbma-gold-001",
    address: "0xB5b3470F502DBFa709bCd4ad0C2a250ff8D49986",
    name: "LBMA Physical Gold",
    symbol: "TGLD",
    description: "London Bullion Market Association certified gold bars held in Brinks vaults.",
    location: "Brinks, London, UK",
    apy: 4.2,
    assetType: "Precious Metal",
  },
  {
    kind: "property",
    externalId: "pcl-residential-pool-001",
    address: "0x2Fd4B60Cad1d75438C34F3ED134BE3480fda931B",
    name: "Residential Yield Pool",
    symbol: "TPROP",
    description: "Fractional ownership in a curated portfolio of prime central London residential properties.",
    location: "Prime Central London, UK",
    apy: 8.4,
    assetType: "Real Estate",
  },
  {
    kind: "carbon",
    externalId: "verra-carbon-001",
    address: "0x0777694b6999F01eA277A430Ad10d224005F7C19",
    name: "Global Carbon Removals",
    symbol: "TCARB",
    description: "Verified carbon removal credits from forestry, BECCS, and direct air capture projects.",
    location: "Global (Verra Registry)",
    apy: 6.1,
    assetType: "Environmental Credit",
  },
];

export const protocolRoutes = (env: Env) => {
  const router = Router();
  const service = new ProtocolService(env);

  /**
   * GET /api/protocol/assets
   * Returns the full RWA token registry merged with off-chain DB metadata.
   * Always returns all 3 tokens — never empty even on a fresh DB.
   */
  router.get("/assets", async (req, res, next) => {
    try {
      // Try to enrich with DB records — but fall back gracefully if DB is unreachable
      let dbMap = new Map<string, any>();
      try {
        const dbAssets = await prisma.asset.findMany();
        dbMap = new Map(dbAssets.map((a) => [`${a.kind}:${a.externalId}`, a]));
      } catch (dbError) {
        console.warn("[protocol/assets] DB unavailable — serving canonical registry only:", (dbError as Error).message);
      }

      // Always return all 3 tokens, enriched with DB data where available
      const merged = KNOWN_TOKENS.map((token) => {
        const db = dbMap.get(`${token.kind}:${token.externalId}`);
        return {
          id: db?.id || token.externalId,
          kind: token.kind,
          externalId: token.externalId,
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          status: db?.status || "active",
          quantity: db?.quantity ?? null,
          apy: token.apy,
          assetType: token.assetType,
          metadata: {
            ...(db?.metadata as object || {}),
            description: token.description,
            location: token.location,
          },
          createdAt: db?.createdAt || new Date().toISOString(),
          updatedAt: db?.updatedAt || new Date().toISOString(),
        };
      });

      res.json({ success: true, data: merged, dbEnriched: dbMap.size > 0 });
    } catch (error) {
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
