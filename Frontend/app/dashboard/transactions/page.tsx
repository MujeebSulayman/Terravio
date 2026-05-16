"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Loader2, ArrowDownLeft, ArrowUpRight, ExternalLink, Filter, Download, TrendingUp as TrendingUpIcon } from "lucide-react";
import { DashboardHeader } from "../../../components/dashboard/DashboardHeader";

export default function TransactionsPage() {
  const { ready, authenticated } = usePrivy();

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  const transactions: any[] = [];

  return (
    <div className="flex-1 overflow-y-auto">
      <DashboardHeader 
        title="Audit Trail" 
        subtitle="Full Transaction History & Proof of Reserves" 
      />

      <div className="p-6 lg:p-12 max-w-[1600px] mx-auto w-full">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="border-b border-slate-100">
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Asset Pool</th>
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-10 py-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Explorer</th>
                 </tr>
              </thead>
               <tbody className="divide-y divide-slate-50">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-10 py-20 text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No transaction records found</p>
                        <p className="text-[10px] text-slate-400 mt-2">All settled on-chain movements will be audited here.</p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 
                                  tx.type === 'claim' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                               }`}>
                                  {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : 
                                   tx.type === 'claim' ? <TrendingUpIcon className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-900 capitalize">{tx.type}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">On-Chain Settlement</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-sm font-bold text-slate-900">{tx.asset}</p>
                         </td>
                         <td className="px-10 py-6">
                            <p className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                               {tx.type === 'deposit' ? '+' : '-'}{tx.amount}
                            </p>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-sm font-medium text-slate-600">{tx.date}</p>
                         </td>
                         <td className="px-10 py-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                               {tx.status}
                            </div>
                         </td>
                         <td className="px-10 py-6">
                            <a href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#C5A059] hover:bg-white hover:shadow-md transition-all">
                               <ExternalLink className="w-4 h-4" />
                            </a>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
           </table>
           <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-center">
              <button className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors">Load More Records</button>
           </div>
        </div>
      </div>
    </div>
  );
}

// Simple internal helper component for table icon
function TrendingUp({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      height="24" 
      stroke="currentColor" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      width="24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
