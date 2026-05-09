import { Hono } from "hono";
import { ProtocolService } from "../services/ProtocolService";
import type { Env } from "../config/env";

const protocol = new Hono<{ Bindings: Env }>();

/**
 * GET /protocol/health
 * Returns the live on-chain status of all RWA tokens.
 */
protocol.get("/health", async (c) => {
  const service = new ProtocolService(c.env);
  try {
    const health = await service.getGlobalHealth();
    return c.json({ success: true, data: health });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

/**
 * POST /protocol/distribute-yield
 * Manual trigger for yield distribution (Admin Only)
 */
protocol.post("/distribute-yield", async (c) => {
  const { tokenAddress, amountUSD } = await c.req.json();
  
  if (!tokenAddress || !amountUSD) {
    return c.json({ success: false, error: "Missing tokenAddress or amountUSD" }, 400);
  }

  const service = new ProtocolService(c.env);
  try {
    const result = await service.distributeYield(tokenAddress, amountUSD);
    return c.json(result);
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

export default protocol;
