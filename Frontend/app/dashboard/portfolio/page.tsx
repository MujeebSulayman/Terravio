"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Loader2, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TOKENS } from "../../../lib/constants";
import { AssetCard } from "../../../components/dashboard/AssetCard";
import { DashboardHeader } from "../../../components/dashboard/DashboardHeader";

export default function PortfolioPage() {
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
        title="Your Portfolio" 
        subtitle="Institutional Asset Allocation" 
      />

      <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        {/* Portfolio Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
           <div className="col-span-1 md:col-span-2 bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059] opacity-20 blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-6">Total Portfolio Value</p>
                 <div className="flex items-baseline gap-4 mb-8">
                    <span className="text-5xl font-serif font-bold">$124,500.00</span>
                    <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                       <ArrowUpRight className="w-4 h-4" />
                       +12.5%
                    </span>
                 </div>
                 <div className="flex gap-4">
                    <button className="h-10 px-6 rounded-xl bg-[#C5A059] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all">Deposit USDC</button>
                    <button className="h-10 px-6 rounded-xl bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Withdraw</button>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                    <TrendingUp className="w-6 h-6" />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Unclaimed Yield</p>
                 <p className="text-2xl font-serif font-bold text-slate-900">$1,240.50</p>
              </div>
              <button className="w-full h-10 mt-6 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all">Claim All Rewards</button>
           </div>

           <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                    <Wallet className="w-6 h-6" />
                 </div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Active Positions</p>
                 <p className="text-2xl font-serif font-bold text-slate-900">3 Assets</p>
              </div>
              <div className="mt-6 flex -space-x-2">
                 {TOKENS.map((t, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white uppercase">
                       {t.id.slice(0, 2)}
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Active Positions */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight mb-8">Active Positions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {TOKENS.map((token) => (
              <AssetCard key={token.id} token={token} userAddress={user?.wallet?.address} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
