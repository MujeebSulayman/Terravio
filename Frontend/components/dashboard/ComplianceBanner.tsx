"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useReadContract } from "wagmi";
import { BaseRWATokenABI } from "../../lib/abi";
import { TOKENS } from "../../lib/constants";

interface ComplianceBannerProps {
  userAddress?: string;
  backendUser?: any;
}

export function ComplianceBanner({ userAddress, backendUser }: ComplianceBannerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { getAccessToken } = usePrivy();
  const kycStatus = backendUser?.kycStatus || "UNVERIFIED";

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const token = await getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/refresh`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      window.location.reload();
    } catch (e) {
      console.error("Status refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { data: isWhitelisted, isLoading } = useReadContract({
    address: TOKENS[0].address,
    abi: BaseRWATokenABI,
    functionName: "isWhitelisted",
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: { enabled: !!userAddress }
  });

  if (isLoading || isWhitelisted || kycStatus === "APPROVED") return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl"
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059] opacity-10 blur-[100px] -mr-32 -mt-32" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059] shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold text-white tracking-tight mb-1">
            {kycStatus === "PENDING" ? "Verification In Progress" : "Institutional Compliance Required"}
          </h3>
          <p className="text-sm text-slate-400 max-w-xl">
            {kycStatus === "PENDING" 
              ? "Your regulatory documents are currently being processed by our compliance team. On-chain whitelisting will occur automatically upon approval."
              : "To access institutional-grade tokenized assets, you must complete our sovereign identity verification process and satisfy AML/KYC requirements."}
          </p>
        </div>
      </div>
      
        {kycStatus !== "PENDING" && (
          <Link 
            href="/verify"
            className="h-12 px-8 inline-flex items-center justify-center rounded-xl bg-[#C5A059] text-white font-bold hover:bg-[#D4AF37] transition-all shadow-lg shadow-[#C5A059]/20 text-xs uppercase tracking-widest"
          >
            Start Onboarding
          </Link>
        )}
    </motion.div>
  );
}
