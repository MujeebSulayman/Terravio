"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TOKENS } from "../../lib/constants";
import { BaseRWATokenABI, ERC20ABI } from "../../lib/abi";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { 
  Wallet, 
  LogOut, 
  Loader2, 
  ArrowRight, 
  TrendingUp, 
  Activity,
  History,
  ShieldCheck,
  ShieldAlert,
  Coins,
  ChevronRight,
  X,
  Lock
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { ready, authenticated, user, logout } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Aggregate stats across all tokens
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [weightedYield, setWeightedYield] = useState(0);

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-[#C5A059] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-white font-serif font-black text-sm">T</span>
              </div>
              <span className="text-xl font-serif font-bold tracking-tight text-slate-900">Terravio</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Wallet</span>
              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}</span>
            </div>
            <button 
              onClick={logout}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all gap-2 uppercase tracking-wider"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Whitelisting Status Banner */}
        <ComplianceBanner userAddress={user?.wallet?.address} />

        {/* Dynamic Overview Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <OverviewStats userAddress={user?.wallet?.address} />
        </section>

        {/* Assets Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Investment Registry</h2>
            <p className="text-slate-500 text-sm">Real-time asset verification and management.</p>
          </div>
          <div className="flex gap-3">
             <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              <History className="w-4 h-4" />
              Logs
            </button>
            <button className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm">
              Marketplace
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Asset Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TOKENS.map((token) => (
            <AssetCard key={token.id} token={token} userAddress={user?.wallet?.address} />
          ))}
        </div>
      </main>
    </div>
  );
}

function ComplianceBanner({ userAddress }: { userAddress?: string }) {
  // We check the first token as a proxy for global whitelisting status
  const { data: isWhitelisted, isLoading } = useReadContract({
    address: TOKENS[0].address,
    abi: BaseRWATokenABI,
    functionName: "isWhitelisted",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  if (isLoading || isWhitelisted) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12 p-6 rounded-xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gold border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-amber-900 tracking-tight">Identity Verification Required</h3>
          <p className="text-sm text-amber-700">To start investing in tokenized real-world assets, you must first complete our KYC verification.</p>
        </div>
      </div>
      <Link 
        href="/verify"
        className="h-11 px-8 inline-flex items-center justify-center rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all shadow-sm whitespace-nowrap"
      >
        Start Verification
      </Link>
    </motion.div>
  );
}

function OverviewStats({ userAddress }: { userAddress?: string }) {
  // In a real prod app, we would sum these up via a multicall or a custom hook
  // For now, we'll show the connection status as the primary stat
  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Value</span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-gold border border-slate-100">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">$---</span>
          <span className="text-[10px] font-bold text-slate-400">USD</span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Yield</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">---%</span>
          <span className="text-[10px] font-bold text-slate-400">AVG APY</span>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Status</span>
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-gold border border-slate-100">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Verified</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </>
  );
}

function AssetCard({ token, userAddress }: { token: typeof TOKENS[0], userAddress?: string }) {
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState("");

  const { data: metadata, refetch: refetchMetadata } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "getAssetMetadata",
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const { data: assetAddress } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "asset",
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: assetAddress || zeroAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: userAddress && token.address ? [userAddress as `0x${string}`, token.address] : undefined,
    query: { enabled: !!userAddress && !!assetAddress && assetAddress !== zeroAddress }
  });

  const { data: isWhitelisted } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "isWhitelisted",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const { data: claimable } = useReadContract({
    address: token.address,
    abi: BaseRWATokenABI,
    functionName: "claimableYield",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchMetadata();
      refetchAllowance();
      setIsInvestModalOpen(false);
      setInvestAmount("");
    }
  }, [isSuccess, refetchBalance, refetchMetadata, refetchAllowance]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  const valuation = metadata ? formatUnits(metadata.valuationUSD, 18) : "0";
  const yieldBPS = metadata ? Number(metadata.yieldBPS) / 100 : 0;
  const userBalance = balance ? formatUnits(balance, 18) : "0";
  const claimableAmount = claimable ? formatUnits(claimable, 18) : "0";

  const needsApproval = useMemo(() => {
    if (!investAmount || !allowance) return false;
    try {
      const amount = parseUnits(investAmount, 18);
      return (allowance as bigint) < amount;
    } catch {
      return false;
    }
  }, [investAmount, allowance]);

  const handleInvest = () => {
    if (!investAmount || isNaN(Number(investAmount))) return;
    
    if (needsApproval) {
      approve({
        address: assetAddress!,
        abi: ERC20ABI,
        functionName: "approve",
        args: [token.address, parseUnits(investAmount, 18)],
      });
      return;
    }

    writeContract({
      address: token.address,
      abi: BaseRWATokenABI,
      functionName: "deposit",
      args: [parseUnits(investAmount, 18), userAddress as `0x${string}`],
    });
  };

  const handleClaim = () => {
    writeContract({
      address: token.address,
      abi: BaseRWATokenABI,
      functionName: "claimYield",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-200 transition-all">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">{token.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {metadata ? metadata.symbol : "---"} • ADDR: {token.address.slice(0, 6)}...
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="px-2 py-0.5 bg-amber-50 text-[#C5A059] rounded text-[10px] font-bold tracking-wider">
              {yieldBPS.toFixed(2)}% APY
            </div>
            {isWhitelisted ? (
              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                <ShieldCheck className="w-3 h-3" />
                Whitelisted
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                <ShieldAlert className="w-3 h-3" />
                Not Verified
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Asset Valuation</span>
            <span className="text-sm font-bold text-slate-900">${Number(valuation).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Your Position</span>
            <span className="text-sm font-bold text-indigo-600">{Number(userBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} Shares</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Claimable Yield</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-600">${Number(claimableAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              {Number(claimableAmount) > 0 && (
                <button 
                  onClick={handleClaim}
                  disabled={isPending || isConfirming}
                  className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {isPending || isConfirming ? "..." : "Claim"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
        <button 
          onClick={() => setIsInvestModalOpen(true)}
          disabled={!isWhitelisted}
          className="flex-1 h-10 inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all gap-2 uppercase tracking-widest disabled:opacity-50 disabled:bg-slate-300"
        >
          {isWhitelisted ? "Invest Assets" : "Verify to Invest"}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Invest Modal */}
      <AnimatePresence>
        {isInvestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvestModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-200"
            >
              <button 
                onClick={() => setIsInvestModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Invest in {token.name}</h3>
                <p className="text-sm text-slate-500">Enter the amount of USDC to deposit.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Amount (USDC)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">USDC</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleInvest}
                disabled={!investAmount || isPending || isConfirming || isApproving || isConfirmingApprove}
                className="w-full h-12 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending || isConfirming || isApproving || isConfirmingApprove ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isApproving || isConfirmingApprove ? "Approving..." : "Processing..."}
                  </>
                ) : needsApproval ? (
                  <>
                    Approve USDC
                    <Lock className="w-4 h-4 text-gold" />
                  </>
                ) : (
                  <>
                    Confirm Investment
                    <Coins className="w-4 h-4 text-gold" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
