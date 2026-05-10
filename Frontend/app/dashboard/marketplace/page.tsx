"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Loader2, Search, Filter, ArrowUpRight } from "lucide-react";
import { TOKENS } from "../../../lib/constants";
import { AssetCard } from "../../../components/dashboard/AssetCard";
import { DashboardHeader } from "../../../components/dashboard/DashboardHeader";

export default function MarketplacePage() {
  const { ready, authenticated, user } = usePrivy();

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <DashboardHeader 
        title="Asset Marketplace" 
        subtitle="Institutional Primary & Secondary Markets" 
      />

      <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        {/* Marketplace Banner */}
        <div className="bg-[#C5A059] rounded-[40px] p-16 mb-16 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
           <div className="max-w-2xl relative z-10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.4em] mb-4 block">New Issuance</span>
              <h2 className="text-5xl font-serif font-bold mb-6 leading-tight">London Prime Residential Yield Pool</h2>
              <p className="text-lg text-white/80 mb-10 leading-relaxed font-medium">
                 Access fractional ownership in a curated portfolio of high-yield residential properties across Prime Central London. Oracle-verified valuations and automated yield distribution.
              </p>
              <button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3">
                 View Offering
                 <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
              </button>
           </div>
        </div>

        {/* Categories */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
           {["All Assets", "Real Estate", "Precious Metals", "Carbon Credits", "Government Bonds"].map((cat, i) => (
              <button 
                key={i} 
                className={`h-10 px-6 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  i === 0 ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "bg-white text-slate-500 border border-slate-200 hover:border-[#C5A059] hover:text-[#C5A059]"
                }`}
              >
                {cat}
              </button>
           ))}
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TOKENS.map((token) => (
            <AssetCard key={token.id} token={token} userAddress={user?.wallet?.address} />
          ))}
        </div>
      </div>
    </div>
  );
}
