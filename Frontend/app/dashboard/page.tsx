"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { TOKENS } from "../../lib/constants";
import { BaseRWATokenABI } from "../../lib/abi";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Wallet, LogOut, Loader2, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-neutral-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Header */}
      <header className="flex justify-between items-center mb-12 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-white text-xl tracking-tighter">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Investor Dashboard</h1>
            <p className="text-sm text-neutral-400">Welcome back, {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium text-neutral-300 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Assets Grid */}
      <section className="z-10 w-full max-w-7xl mx-auto">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-indigo-400" />
          Available Assets
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOKENS.map((token) => (
            <AssetCard key={token.id} token={token} userAddress={user?.wallet?.address} />
          ))}
        </div>
      </section>
    </main>
  );
}

function AssetCard({ token, userAddress }: { token: typeof TOKENS[0], userAddress?: string }) {
  // Fetch metadata directly from the smart contract!
  const { data: metadata, isLoading } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "getAssetMetadata",
  });

  // Fetch user balance directly from the smart contract!
  const { data: balance } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  const valuation = metadata ? formatUnits(metadata.valuationUSD, 18) : "0";
  const yieldBPS = metadata ? Number(metadata.yieldBPS) / 100 : 0;
  const userBalance = balance ? formatUnits(balance, 18) : "0";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col hover:border-neutral-700 transition-colors relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all" />
      
      <div className="flex justify-between items-start mb-6 z-10">
        <div>
          <h3 className="font-bold text-xl text-white">{token.name}</h3>
          <p className="text-sm text-neutral-400 mt-1">{metadata ? metadata.symbol : "Loading..."}</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
          {yieldBPS}% APY
        </div>
      </div>

      <div className="space-y-4 mb-8 flex-1 z-10">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <span className="text-neutral-400 text-sm">Asset Valuation</span>
          <span className="font-medium">${Number(valuation).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-400 text-sm">Your Holdings</span>
          <span className="font-medium text-emerald-400">{Number(userBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} shares</span>
        </div>
      </div>

      <button className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 z-10 relative">
        Invest Now
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
