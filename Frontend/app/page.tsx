"use client";

import { usePrivy } from "@privy-io/react-auth";
import { motion } from "framer-motion";
import { 
  Building2, 
  Leaf, 
  Coins, 
  ArrowRight, 
  ShieldCheck, 
  Database, 
  LineChart, 
  CheckCircle2,
  Lock,
  Globe
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { login, authenticated } = usePrivy();

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Terravio</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#assets" className="hover:text-indigo-600 transition-colors">Assets</a>
            <a href="#technology" className="hover:text-indigo-600 transition-colors">Technology</a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">Security</a>
          </div>

          <div>
            {authenticated ? (
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <button 
                onClick={login}
                className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8">
            <Globe className="w-3 h-3" />
            Institutional RWA Protocol
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
            Next-Generation <br />
            <span className="text-indigo-600">Asset Tokenization.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl">
            Secure, fractional ownership of high-yield real world assets. Built on Base, powered by Chainlink, and secured by institutional-grade compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={authenticated ? undefined : login}
              className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all group"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#assets"
              className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
            >
              Browse Registry
            </a>
          </div>
        </div>
      </section>

      {/* Assets Section */}
      <section id="assets" className="px-6 py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Asset Classes</h2>
            <h3 className="text-3xl font-bold text-slate-900">Portfolio Selection</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AssetCard 
              icon={<Building2 className="w-6 h-6" />}
              title="Real Estate"
              description="Fractionalized shares in premium rental properties with monthly yield distribution."
              stats="8.4% APY"
              tags={["Yield", "Property"]}
            />
            <AssetCard 
              icon={<Coins className="w-6 h-6" />}
              title="Physical Gold"
              description="LBMA-certified physical gold vaulted in London, tokenized with 1:1 backing."
              stats="inflation hedge"
              tags={["Commodity", "Stability"]}
            />
            <AssetCard 
              icon={<Leaf className="w-6 h-6" />}
              title="Carbon Credits"
              description="Verified nature-based carbon removals with dynamic oracle-based valuation."
              stats="ESG Native"
              tags={["Environment", "Growth"]}
            />
          </div>
        </div>
      </section>

      {/* Technology / Architecture Section */}
      <section id="technology" className="px-6 py-24 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-3">Architecture</h2>
            <h3 className="text-3xl font-bold text-slate-900 mb-8">Built for Reliability</h3>
            
            <div className="space-y-8">
              <TechItem 
                icon={<Database className="w-5 h-5" />}
                title="Chainlink Functions"
                description="Real-time off-chain data integration for accurate asset valuation and oracle updates."
              />
              <TechItem 
                icon={<ShieldCheck className="w-5 h-5" />}
                title="EIP-712 Compliance"
                description="Regulatory-ready whitelisting and KYC integration using cryptographic signatures."
              />
              <TechItem 
                icon={<LineChart className="w-5 h-5" />}
                title="Yield Engine"
                description="Automated distribution of earnings proportional to on-chain token holdings."
              />
            </div>
          </div>
          <div className="flex-1 w-full bg-slate-900 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-slate-400">On-Chain Registry Active</span>
            </div>
            <div className="space-y-4 font-mono text-sm leading-relaxed">
              <p className="text-indigo-400"># Asset Metadata Contract</p>
              <p><span className="text-slate-500">mapping</span>(address ={">"} Asset) public registry;</p>
              <p className="pl-4"><span className="text-slate-500">struct</span> Asset {"{"}</p>
              <p className="pl-8 text-emerald-400">string ipfsCID;</p>
              <p className="pl-8 text-emerald-400">uint256 valuationUSD;</p>
              <p className="pl-8 text-emerald-400">uint256 yieldBPS;</p>
              <p className="pl-4">{"}"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="px-6 py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-600/30">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Institutional Security</h2>
          <p className="text-slate-400 max-w-2xl mx-auto mb-16 text-lg">
            Terravio employs multi-layered security protocols to ensure asset safety and regulatory compliance across all jurisdictions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <SecurityFeature 
              title="Verified KYC"
              description="Mandatory identity verification via Didit before any interaction with the protocol."
            />
            <SecurityFeature 
              title="Proof of Reserve"
              description="Independent valuation audits pushed to the blockchain via Chainlink oracles."
            />
            <SecurityFeature 
              title="Non-Custodial"
              description="Complete control over your assets with trustless smart contract execution."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">T</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">Terravio</span>
          </div>
          <div className="flex gap-8 text-slate-500 text-sm">
            <a href="#" className="hover:text-slate-900">Terms</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Registry</a>
          </div>
          <div className="text-slate-400 text-sm">
            &copy; 2026 Terravio Protocol. Built on Base.
          </div>
        </div>
      </footer>
    </div>
  );
}

function AssetCard({ icon, title, description, stats, tags }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  stats: string,
  tags: string[]
}) {
  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col group">
      <div className="text-indigo-600 mb-6 bg-slate-50 w-12 h-12 flex items-center justify-center rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
        {icon}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded">
            {tag}
          </span>
        ))}
      </div>
      <h4 className="text-xl font-bold text-slate-900 mb-4">{title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed mb-8 flex-1">
        {description}
      </p>
      <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected</span>
        <span className="text-indigo-600 font-bold">{stats}</span>
      </div>
    </div>
  );
}

function TechItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-8 h-8 flex-shrink-0 rounded bg-slate-50 flex items-center justify-center text-indigo-600 border border-slate-100">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function SecurityFeature({ title, description }: { title: string, description: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
        <h4 className="font-bold text-white uppercase tracking-wider text-xs">{title}</h4>
      </div>
      <p className="text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
