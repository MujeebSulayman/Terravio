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
    valuation: string;      // formatted USD string e.g. "1250000.00"
    lastUpdated: string;    // ISO timestamp
    isActive: boolean;
  };
};

type ProtocolHealth = {
  address: string;
  name?: string;
  valuation?: string;
  lastUpdated?: string;
  status?: number;
  error?: string;
};

type UseProtocolDataReturn = {
  assets: RwaAsset[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
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
        // Health endpoint may fail if RPC is unavailable — that's non-fatal
        console.warn("[useProtocolData] On-chain health unavailable; using off-chain data only");
      }

      // Merge on-chain health into assets
      const enriched: RwaAsset[] = baseAssets.map((asset) => {
        const health = healthMap.get(asset.address?.toLowerCase());
        return {
          ...asset,
          onChain: health && !health.error
            ? {
                valuation: health.valuation || "0",
                lastUpdated: health.lastUpdated || new Date().toISOString(),
                isActive: health.status === 1,
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

  return { assets, isLoading, error, refetch: fetchData };
}
