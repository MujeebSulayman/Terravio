"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-gold border border-slate-100 mx-auto mb-8">
            <ShieldCheck className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4 tracking-tight">Identity Verification</h1>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            Terravio is a regulated RWA protocol. To ensure compliance and protect our investors, we require a one-time identity verification (KYC) before you can deposit assets.
          </p>

          <div className="space-y-6 text-left bg-slate-50 p-6 rounded-xl border border-slate-100 mb-10">
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
              <p className="text-sm text-slate-600">Connect your wallet (Completed)</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
              <p className="text-sm text-slate-600 font-bold">Complete Didit session (Verification of ID & Liveness)</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
              <p className="text-sm text-slate-400">Automatic Whitelisting on Base Sepolia</p>
            </div>
          </div>

          <button 
            className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 text-lg"
            onClick={() => window.open('https://didit.me', '_blank')}
          >
            Launch Didit Verification
            <ExternalLink className="w-5 h-5" />
          </button>
          
          <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-widest font-bold">
            Powered by Didit Compliance Engine
          </p>
        </div>
      </main>
    </div>
  );
}
