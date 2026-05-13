"use client";

import { useMemo } from "react";
import { Wallet, TrendingUp, ShieldCheck } from "lucide-react";
import type { RwaAsset } from "../../lib/hooks/useProtocolData";

interface OverviewStatsProps {
  backendUser?: any;
  assets?: RwaAsset[];
  isLoading?: boolean;
}

export function OverviewStats({ backendUser, assets = [], isLoading = false }: OverviewStatsProps) {
  const kycStatus = backendUser?.kycStatus || "UNVERIFIED";

  // Total protocol valuation: prefer on-chain valuation if available, else sum quantities
  const totalValuation = useMemo(() => {
    if (assets.length === 0) return 0;
    const onChainSum = assets.reduce((sum, a) => {
      const val = a.onChain?.valuation ? parseFloat(a.onChain.valuation) : 0;
      return sum + val;
    }, 0);
    if (onChainSum > 0) return onChainSum;
    // Fallback: sum raw quantities
    return assets.reduce((sum, a) => sum + (a.quantity || 0), 0);
  }, [assets]);

  // Weighted average APY from the protocol registry
  const avgApy = useMemo(() => {
    if (assets.length === 0) return "—";
    const avg = assets.reduce((sum, a) => sum + (a.apy || 0), 0) / assets.length;
    return avg.toFixed(1);
  }, [assets]);

  const stats = [
    {
      label: "Total Value Backed",
      value: isLoading ? "..." : `$${totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      suffix: "USD",
      icon: Wallet,
      color: "text-[#C5A059]",
      bg: "bg-amber-50",
    },
    {
      label: "Protocol Yield",
      value: isLoading ? "..." : `${avgApy}%`,
      suffix: "AVG APY",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Compliance Status",
      value: kycStatus === "APPROVED" ? "Verified" : kycStatus === "PENDING" ? "Pending" : "Unverified",
      icon: ShieldCheck,
      color: kycStatus === "APPROVED" ? "text-emerald-600" : "text-amber-500",
      bg: kycStatus === "APPROVED" ? "bg-emerald-50" : "bg-amber-50",
      pulse: true,
    },
  ];

  return (
    <>
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</span>
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} border border-transparent group-hover:border-current transition-all`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <div className="h-8 w-28 bg-slate-100 rounded-xl animate-pulse" />
                ) : (
                  <>
                    <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight">{stat.value}</span>
                    {stat.suffix && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.suffix}</span>}
                  </>
                )}
              </div>
              {stat.pulse && (
                <div className={`w-2 h-2 rounded-full animate-pulse ${stat.color.replace("text", "bg")}`} />
              )}
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full ${stat.color.replace("text", "bg")} w-2/3 opacity-20`} />
            </div>
          </div>
        );
      })}
    </>
  );
}
