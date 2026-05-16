"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Coins, 
  X, 
  Lock, 
  Loader2 
} from "lucide-react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { BaseRWATokenABI, ERC20ABI } from "../../lib/abi";
import type { RwaAsset } from "../../lib/hooks/useProtocolData";

interface AssetCardProps {
  token: RwaAsset;
  userAddress?: string;
}

export function AssetCard({ token, userAddress }: AssetCardProps) {
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState("");

  const { data: metadata, refetch: refetchMetadata } = useReadContract({
    address: token.address as `0x${string}`,
    abi: BaseRWATokenABI,
    functionName: "getAssetMetadata",
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: BaseRWATokenABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const { data: assetAddress } = useReadContract({
    address: token.address as `0x${string}`,
    abi: BaseRWATokenABI,
    functionName: "asset",
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: (assetAddress as `0x${string}`) || zeroAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: userAddress && token.address ? [userAddress as `0x${string}`, token.address as `0x${string}`] : undefined,
    query: { enabled: !!userAddress && !!assetAddress && assetAddress !== zeroAddress }
  });

  const { data: isWhitelisted } = useReadContract({
    address: token.address as `0x${string}`,
    abi: BaseRWATokenABI,
    functionName: "isWhitelisted",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  const { data: claimable } = useReadContract({
    address: token.address as `0x${string}`,
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
        address: assetAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: "approve",
        args: [token.address as `0x${string}`, parseUnits(investAmount, 18)],
      });
      return;
    }

    writeContract({
      address: token.address as `0x${string}`,
      abi: BaseRWATokenABI,
      functionName: "deposit",
      args: [parseUnits(investAmount, 18), userAddress as `0x${string}`],
    });
  };

  const handleClaim = () => {
    writeContract({
      address: token.address as `0x${string}`,
      abi: BaseRWATokenABI,
      functionName: "claimYield",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-[#C5A059]/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-slate-900 tracking-tight">{token.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              {metadata ? metadata.symbol : "---"} • ADDR: {token.address?.slice(0, 6) || "0x..."}...
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="px-3 py-1 bg-slate-900 text-[#C5A059] rounded-full text-[10px] font-bold tracking-[0.1em] shadow-sm">
              {yieldBPS.toFixed(2)}% APY
            </div>
            {isWhitelisted ? (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3 h-3" />
                Restricted
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Asset Valuation</span>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 block">${Number(valuation).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="text-[9px] text-slate-400 font-medium">Oracle Verified</span>
            </div>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-50">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Your Position</span>
            <div className="text-right">
              <span className="text-sm font-bold text-[#C5A059] block">{Number(userBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} Shares</span>
              <span className="text-[9px] text-slate-400 font-medium">Locked Equity</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Claimable Yield</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-emerald-600">${Number(claimableAmount).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              {Number(claimableAmount) > 0 && (
                <button 
                  onClick={handleClaim}
                  disabled={isPending || isConfirming}
                  className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isPending || isConfirming ? "..." : "Claim"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100">
        <button 
          onClick={() => setIsInvestModalOpen(true)}
          disabled={!isWhitelisted}
          className="w-full h-12 inline-flex items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#C5A059] hover:text-white transition-all duration-300 gap-2 uppercase tracking-[0.2em] shadow-lg shadow-slate-200 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
        >
          {isWhitelisted ? "Deploy Capital" : "Verification Required"}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border border-slate-100"
            >
              <button 
                onClick={() => setIsInvestModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-4 shadow-lg">
                   <Coins className="w-6 h-6 text-[#C5A059]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Invest in {token.name}</h3>
                <p className="text-sm text-slate-500 font-medium">Enter the USDC amount to deploy into this pool.</p>
              </div>

              <div className="space-y-6 mb-10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (USDC)</label>
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase cursor-pointer hover:underline">Max Available</span>
                  </div>
                  <div className="relative group">
                    <input 
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059] transition-all text-lg"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center">
                         <span className="text-[8px] text-white font-black">$</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">USDC</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                   <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Estimated Shares</span>
                      <span className="text-slate-900 font-bold">{investAmount || "0.00"}</span>
                   </div>
                   <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Protocol Fee (0.1%)</span>
                      <span className="text-slate-900 font-bold">{(Number(investAmount) * 0.001).toFixed(2)} USDC</span>
                   </div>
                </div>
              </div>

              <button 
                onClick={handleInvest}
                disabled={!investAmount || isPending || isConfirming || isApproving || isConfirmingApprove}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold hover:bg-[#C5A059] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200"
              >
                {isPending || isConfirming || isApproving || isConfirmingApprove ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isApproving || isConfirmingApprove ? "Confirming Allowance..." : "Deploying Capital..."}
                  </>
                ) : needsApproval ? (
                  <>
                    Authorize USDC Usage
                    <Lock className="w-4 h-4 text-[#C5A059]" />
                  </>
                ) : (
                  <>
                    Confirm Deployment
                    <ArrowRight className="w-4 h-4" />
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
