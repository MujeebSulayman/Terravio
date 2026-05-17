"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, ArrowUpRight, Search } from "lucide-react";
import { useProtocolData, type RwaAsset } from "../../../lib/hooks/useProtocolData";
import { AssetCard } from "../../../components/dashboard/AssetCard";
import { DashboardHeader } from "../../../components/dashboard/DashboardHeader";

const CATEGORIES = ["All Assets", "Real Estate", "Precious Metal", "Environmental Credit"];

export default function MarketplacePage() {
  const { ready, authenticated, user } = usePrivy();
  const { assets, isLoading } = useProtocolData();
  const [activeCategory, setActiveCategory] = useState("All Assets");
  const [search, setSearch] = useState("");

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  // Filter assets to match active category and search
  const filteredAssets = assets.filter((asset) => {
    const matchesCategory =
      activeCategory === "All Assets" || asset.assetType === activeCategory;
    const matchesSearch =
      !search ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.assetType?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Feature the property token in the banner
  const featuredAsset = assets.find((a) => a.kind === "property");

  return (
    <div className="flex-1 overflow-y-auto">
      <DashboardHeader
        title="Asset Marketplace"
        subtitle="Institutional Primary & Secondary Markets"
      />

      <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        {/* Marketplace Banner */}
        <div className="bg-[#C5A059] rounded-[40px] p-12 lg:p-16 mb-16 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.4em] mb-4 block">
              {isLoading ? "Loading..." : `${assets.length} Assets Listed`}
            </span>
            <h2 className="text-4xl lg:text-5xl font-serif font-bold mb-6 leading-tight">
              {featuredAsset?.name || "Terravio Property"}
            </h2>
            <p className="text-lg text-white/80 mb-10 leading-relaxed font-medium">
              {(featuredAsset?.metadata?.description as string) ||
                "Fractional ownership in a curated portfolio of prime central London residential properties."}
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              <button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3">
                View Offering
                <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
              </button>
              {featuredAsset?.apy && (
                <div className="text-white/80 text-sm font-bold">
                  <span className="text-white text-2xl font-serif">{featuredAsset.apy}%</span> APY
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search + Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all"
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(cat)}
                className={`h-11 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-[#C5A059] hover:text-[#C5A059]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-2xl border border-slate-100 animate-pulse" />
            ))
          ) : filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <AssetCard key={asset.id} token={asset} userAddress={user?.wallet?.address} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No assets match your filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
