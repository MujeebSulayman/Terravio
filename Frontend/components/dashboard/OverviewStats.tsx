"use client";

import { useMemo } from "react";
import { 
  Wallet, 
  TrendingUp, 
  ShieldCheck 
} from "lucide-react";

interface OverviewStatsProps {
  backendUser?: any;
  assets?: any[];
}

export function OverviewStats({ backendUser, assets = [] }: OverviewStatsProps) {
  const kycStatus = backendUser?.kycStatus || "UNVERIFIED";
  
  const totalValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.quantity || 0), 0);
  }, [assets]);

  const avgYield = useMemo(() => {
    return "6.2"; 
  }, [assets]);
  
  const stats = [
    {
      label: "Total Value Backed",
      value: `$${totalValue.toLocaleString()}`,
      suffix: "USD",
      icon: Wallet,
      color: "text-[#C5A059]",
      bg: "bg-amber-50"
    },
    {
      label: "Protocol Yield",
      value: `${avgYield}%`,
      suffix: "AVG APY",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Compliance Status",
      value: kycStatus === "APPROVED" ? "Verified" : kycStatus === "PENDING" ? "Pending" : "Unverified",
      icon: ShieldCheck,
      color: kycStatus === "APPROVED" ? "text-emerald-600" : "text-amber-500",
      bg: kycStatus === "APPROVED" ? "bg-emerald-50" : "bg-amber-50",
      pulse: true
    }
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
                <span className="text-3xl font-serif font-bold text-slate-900 tracking-tight">{stat.value}</span>
                {stat.suffix && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.suffix}</span>}
              </div>
              {stat.pulse && (
                <div className={`w-2 h-2 rounded-full animate-pulse ${stat.color.replace('text', 'bg')}`} />
              )}
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
               <div className={`h-full ${stat.color.replace('text', 'bg')} w-2/3 opacity-20`} />
            </div>
          </div>
        );
      })}
    </>
  );
}
