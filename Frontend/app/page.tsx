"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { Building2, Leaf, Coins, ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { login, authenticated, user } = usePrivy();

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="font-bold text-white tracking-tighter">T</span>
          </div>
          <span className="font-semibold text-xl tracking-tight">Terravio</span>
        </div>
        <nav>
          {authenticated ? (
            <Link 
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-md text-sm font-medium transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button 
              onClick={login}
              className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
            >
              Connect Wallet
            </button>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 z-10 text-center mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Live on Base Sepolia
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-6"
        >
          Invest in Tokenized <br /> Real-World Assets
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed"
        >
          Fractional ownership of high-yield properties, verified carbon credits, and institutional-grade gold. Fully regulated and KYC-compliant on the blockchain.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <button 
            onClick={authenticated ? () => window.location.href='/dashboard' : login}
            className="px-8 py-4 rounded-full bg-white text-neutral-950 font-semibold flex items-center gap-2 hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
          >
            {authenticated ? "View Portfolio" : "Start Investing"}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-8 py-4 rounded-full bg-white/5 text-white border border-white/10 font-medium hover:bg-white/10 transition-all backdrop-blur-md">
            View Assets
          </button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full text-left"
        >
          <FeatureCard 
            icon={<Building2 className="w-5 h-5 text-blue-400" />}
            title="Real Estate"
            desc="Earn rental yield and capital appreciation from premium properties."
            color="from-blue-500/20 to-transparent border-blue-500/20"
          />
          <FeatureCard 
            icon={<Leaf className="w-5 h-5 text-emerald-400" />}
            title="Carbon Credits"
            desc="Invest in verified ESG projects making a real-world impact."
            color="from-emerald-500/20 to-transparent border-emerald-500/20"
          />
          <FeatureCard 
            icon={<Coins className="w-5 h-5 text-amber-400" />}
            title="Physical Gold"
            desc="Hedge against inflation with institutionally vaulted gold."
            color="from-amber-500/20 to-transparent border-amber-500/20"
          />
        </motion.div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${color} bg-neutral-900/50 border backdrop-blur-sm flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-default`}>
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
