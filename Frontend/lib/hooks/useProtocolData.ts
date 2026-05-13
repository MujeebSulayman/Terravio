"use client";

import { useState, useEffect, useCallback } from "react";

export type RwaAsset = {
  id: string;
  kind: string;
  externalId: string;
  address: string;
  name: string;
  symbol: string;
  status: string;
  quantity: number | null;
  apy: number;
  assetType: string;
  metadata: {
    description?: string;
    location?: string;
    project?: string;
    [key: string]: unknown;
  };
  // Enriched from on-chain health endpoint
  onChain?: {
    name: string;
    symbol: string;
    valuation: string;       // formatted USD string — 18-decimal normalised, e.g. "500000.0"
    yieldBPS: number;        // raw basis points e.g. 800
    apyPercent: string;      // e.g. "8.00"
    totalIssuance: string;   // formatted token supply
    lastUpdated: string | null; // ISO timestamp or null if never updated
    isActive: boolean;
    statusLabel: string;     // "ACTIVE" | "PENDING" | "PAUSED" | "REDEEMED"
  };
};

type ProtocolHealth = {
  address: string;
  name?: string;
  symbol?: string;
  valuation?: string;
  yieldBPS?: number;
  apyPercent?: string;
  totalIssuance?: string;
  lastUpdated?: string | null;
  status?: number;
  statusLabel?: string;
  error?: string;
};

type UseProtocolDataReturn = {
  assets: RwaAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  /** Total protocol valuation in USD (sum of on-chain valuations) */
  totalValuationUSD: number;
  /** Weighted average APY from on-chain yieldBPS */
  avgApyPercent: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useProtocolData(): UseProtocolDataReturn {
  const [assets, setAssets] = useState<RwaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both in parallel
      const [assetsRes, healthRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/protocol/assets`),
        fetch(`${API_URL}/api/protocol/health`),
      ]);

      let baseAssets: RwaAsset[] = [];
      let healthMap = new Map<string, ProtocolHealth>();

      // Parse off-chain assets
      if (assetsRes.status === "fulfilled" && assetsRes.value.ok) {
        const data = await assetsRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          baseAssets = data.data;
        }
      } else {
        console.warn("[useProtocolData] Failed to fetch assets from backend");
      }

      // Parse on-chain health
      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const data = await healthRes.value.json();
        if (data.success && Array.isArray(data.data)) {
          const healthData: ProtocolHealth[] = data.data;
          healthData.forEach((h) => {
            if (h.address) {
              healthMap.set(h.address.toLowerCase(), h);
            }
          });
        }
      } else {
        console.warn("[useProtocolData] On-chain health unavailable; using off-chain data only");
      }

      // Merge on-chain health into assets
      const enriched: RwaAsset[] = baseAssets.map((asset) => {
        const health = healthMap.get(asset.address?.toLowerCase());
        return {
          ...asset,
          onChain: health && !health.error
            ? {
                name:          health.name || asset.name,
                symbol:        health.symbol || asset.symbol,
                valuation:     health.valuation || "0",
                yieldBPS:      health.yieldBPS ?? 0,
                apyPercent:    health.apyPercent || "0.00",
                totalIssuance: health.totalIssuance || "0",
                lastUpdated:   health.lastUpdated || null,
                isActive:      health.status === 1,
                statusLabel:   health.statusLabel || "UNKNOWN",
              }
            : undefined,
        };
      });

      setAssets(enriched);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      console.error("[useProtocolData] Fatal error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived aggregates — computed from enriched assets
  const totalValuationUSD = assets.reduce((sum, a) => {
    const val = a.onChain?.valuation ? parseFloat(a.onChain.valuation) : 0;
    return sum + val;
  }, 0);

  const avgApyPercent = (() => {
    const withOnChain = assets.filter((a) => a.onChain && a.onChain.yieldBPS > 0);
    if (withOnChain.length === 0) {
      // Fall back to registry APY
      if (assets.length === 0) return "—";
      const avg = assets.reduce((s, a) => s + (a.apy || 0), 0) / assets.length;
      return avg.toFixed(1);
    }
    const avg = withOnChain.reduce((s, a) => s + (a.onChain!.yieldBPS / 100), 0) / withOnChain.length;
    return avg.toFixed(2);
  })();

  return { assets, isLoading, error, refetch: fetchData, totalValuationUSD, avgApyPercent };
}
