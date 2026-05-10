"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Loader2, History, ChevronRight } from "lucide-react";
import { TOKENS } from "../../lib/constants";
import { OverviewStats } from "../../components/dashboard/OverviewStats";
import { ComplianceBanner } from "../../components/dashboard/ComplianceBanner";
import { AssetCard } from "../../components/dashboard/AssetCard";
import { InventoryList } from "../../components/dashboard/InventoryList";
import { ProtocolComposition } from "../../components/dashboard/ProtocolComposition";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";

export default function DashboardOverview() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const [backendUser, setBackendUser] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/protocol/assets`);
        const data = await res.json();
        if (data.success) {
          setAssets(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch assets:", e);
      }
    };
    fetchAssets();
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      if (authenticated && user) {
        setIsSyncing(true);
        try {
          const token = await getAccessToken();
          const email = user.email?.address || user.linkedAccounts.find(a => a.type === 'email')?.address;
          const wallet = user.wallet?.address || user.linkedAccounts.find(a => a.type === 'wallet')?.address;

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, wallet })
          });
          const data = await res.json();
          setBackendUser(data);
        } catch (e) {
          console.error("User sync failed:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    syncUser();
  }, [authenticated, user, getAccessToken]);

  if (!ready || !authenticated || isSyncing) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <DashboardHeader 
        title="Institutional Overview" 
        subtitle="Sovereign Wealth & RWA Management" 
      />

      <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        {/* Compliance Status */}
        <ComplianceBanner userAddress={user?.wallet?.address} backendUser={backendUser} />

        {/* Global Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <OverviewStats backendUser={backendUser} assets={assets} />
        </section>

        {/* Composition Chart */}
        <ProtocolComposition assets={assets} />

        {/* Live Inventory */}
        <InventoryList assets={assets} />

        {/* Featured Opportunities */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-tight mb-2">Investment Registry</h2>
              <p className="text-slate-500 text-sm font-medium">Verified liquidity pools backed by tangible global assets.</p>
            </div>
            <div className="flex gap-4">
               <button className="h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Logs
              </button>
              <button className="h-12 px-6 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                Marketplace
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {TOKENS.map((token) => (
              <AssetCard key={token.id} token={token} userAddress={user?.wallet?.address} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
