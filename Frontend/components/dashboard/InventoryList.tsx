"use client";

import { MapPin, TrendingUp, Package } from "lucide-react";
import type { RwaAsset } from "../../lib/hooks/useProtocolData";

interface InventoryListProps {
  assets: RwaAsset[];
  isLoading?: boolean;
}

const KIND_ICONS: Record<string, string> = {
  gold: "GLD",
  property: "EST",
  carbon: "CRB",
};

const KIND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: "bg-amber-900", text: "text-[#C5A059]", border: "border-amber-700/30" },
  property: { bg: "bg-slate-900", text: "text-slate-100", border: "border-slate-700/30" },
  carbon: { bg: "bg-emerald-900", text: "text-emerald-300", border: "border-emerald-700/30" },
};

export function InventoryList({ assets, isLoading = false }: InventoryListProps) {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Underlying Asset Inventory</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Collateral & RWA Registry</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Oracle Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton cards
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-slate-100 rounded" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
              </div>
            </div>
          ))
        ) : assets.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            <Package className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">No Assets in Registry</p>
            <p className="text-xs text-slate-400 mt-1">Assets will appear once deployed to the protocol.</p>
          </div>
        ) : (
          assets.map((asset) => {
            const colors = KIND_COLORS[asset.kind] || KIND_COLORS.property;
            const abbr = KIND_ICONS[asset.kind] || asset.kind.slice(0, 3).toUpperCase();
            const onChainVal = asset.onChain?.valuation
              ? `$${parseFloat(asset.onChain.valuation).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : null;

            return (
              <div
                key={asset.id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center text-[10px] font-bold uppercase tracking-tighter shadow-lg group-hover:rotate-12 transition-transform ${colors.text}`}>
                    {abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{asset.assetType}</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{asset.name}</p>
                  </div>
                  {/* Status badge */}
                  <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                    asset.status === "active" || asset.onChain?.isActive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {asset.status === "active" || asset.onChain?.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                {/* Data rows */}
                <div className="space-y-3 mb-6">
                  {asset.quantity !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Quantity</span>
                      <span className="text-xs font-bold text-slate-900">
                        {asset.quantity.toLocaleString()}{" "}
                        {asset.kind === "gold" ? "g" : asset.kind === "carbon" ? "Credits" : "Units"}
                      </span>
                    </div>
                  )}

                  {onChainVal && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Oracle Valuation</span>
                      <span className="text-xs font-bold text-[#C5A059]">{onChainVal}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Registry APY</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {asset.apy}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Token Symbol</span>
                    <span className="text-[10px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{asset.symbol}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                  <p className="text-[10px] text-slate-400 font-medium italic truncate">
                    {(asset.metadata?.location as string) || (asset.metadata?.project as string) || "Global Sovereign Registry"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
