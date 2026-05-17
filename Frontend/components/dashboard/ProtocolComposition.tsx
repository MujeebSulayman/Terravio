"use client";

import type { RwaAsset } from "../../lib/hooks/useProtocolData";

interface ProtocolCompositionProps {
  assets: RwaAsset[];
  isLoading?: boolean;
}

const COLORS: Record<string, string> = {
  gold: "#C5A059",
  property: "#1e293b",
  carbon: "#10b981",
};

export function ProtocolComposition({ assets, isLoading = false }: ProtocolCompositionProps) {
  // Use on-chain valuation for composition if available, else APY as a proxy weight
  const totalWeight = assets.reduce((sum, a) => {
    const val = a.onChain?.valuation ? parseFloat(a.onChain.valuation) : a.apy;
    return sum + val;
  }, 0);

  return (
    <section className="mb-16 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
        {/* Ring visual */}
        <div className="shrink-0">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[24px] border-slate-50" />
            <div className="absolute inset-0 rounded-full border-[24px] border-[#C5A059] border-t-transparent border-r-transparent rotate-45 shadow-sm" />

            <div className="text-center">
              {isLoading ? (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="h-10 w-20 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="text-5xl font-serif font-bold text-slate-900 mb-1">
                    {assets.length > 0 ? assets.length : "0"}
                    <span className="text-2xl ml-0.5"> RWA{assets.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                    {assets.length > 0 ? "100% Collateralized" : "No Assets"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Composition breakdown */}
        <div className="flex-1 w-full">
          <div className="mb-8">
            <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Protocol Composition</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Real-Time Asset Distribution Analysis
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-50 animate-pulse">
                  <div className="h-3 w-20 bg-slate-100 rounded mb-4" />
                  <div className="h-8 w-16 bg-slate-100 rounded" />
                </div>
              ))
            ) : assets.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                  No assets in the protocol registry
                </p>
              </div>
            ) : (
              assets.map((asset) => {
                const weight = asset.onChain?.valuation ? parseFloat(asset.onChain.valuation) : asset.apy;
                const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : "0.0";
                const color = COLORS[asset.kind] || "#94a3b8";

                return (
                  <div
                    key={asset.id}
                    className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group/item"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {asset.assetType}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-serif font-bold text-slate-900">{percentage}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium mt-3">{asset.onChain?.name || asset.name}</p>

                    {asset.onChain?.valuation && (
                      <p className="text-xs font-bold text-[#C5A059] mt-1">
                        ${parseFloat(asset.onChain.valuation).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
