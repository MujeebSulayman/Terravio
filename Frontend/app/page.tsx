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
  Globe,
  ChevronRight,
  Plus,
  Minus,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const { login, authenticated } = usePrivy();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] w-full border-b border-slate-200/50 bg-[#FAF9F6]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-8 h-8 rounded bg-[#C5A059] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-white font-serif font-black text-sm">T</span>
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-slate-900">Terravio</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-slate-500">
            <a href="#market" className="hover:text-[#C5A059] transition-colors">Market</a>
            <a href="#process" className="hover:text-[#C5A059] transition-colors">Process</a>
            <a href="#compliance" className="hover:text-[#C5A059] transition-colors">Compliance</a>
            <a href="#faq" className="hover:text-[#C5A059] transition-colors">Support</a>
          </div>

          <div>
            {authenticated ? (
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <button 
                onClick={login}
                className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
              >
                Launch App
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-40 md:pb-48 max-w-7xl mx-auto overflow-hidden">
        <div className="max-w-4xl relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-serif font-normal tracking-tight text-slate-900 mb-8 leading-[0.95]"
          >
            The Gold Standard <br />
            <span className="text-[#C5A059]">for Digital Assets.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 mb-12 leading-relaxed max-w-2xl font-light"
          >
            Secure, fractional ownership of high-yield properties, physical gold, and carbon removals. Fully verified and compliant on the blockchain.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <button 
              onClick={login}
              className="inline-flex items-center justify-center h-14 px-10 rounded-lg bg-slate-900 text-white font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all group shadow-xl shadow-slate-200"
            >
              Start Investing
              <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a 
              href="#market"
              className="inline-flex items-center justify-center h-14 px-10 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
            >
              Explore Assets
            </a>
          </motion.div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 hidden lg:block opacity-10 pointer-events-none">
           <div className="w-[600px] h-[600px] border border-[#C5A059] rounded-full absolute -right-20 -top-20" />
           <div className="w-[400px] h-[400px] border border-[#C5A059] rounded-full absolute right-20 top-20" />
        </div>
      </section>

      {/* Social Proof / Partners */}
      <section className="border-y border-slate-200/50 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-12 grayscale opacity-40">
           <div className="text-xl font-serif font-black tracking-tighter">BASE</div>
           <div className="text-xl font-serif font-black tracking-tighter italic underline decoration-[#C5A059]">CHAINLINK</div>
           <div className="text-xl font-serif font-black tracking-tighter uppercase">Privy</div>
           <div className="text-xl font-serif font-black tracking-tighter">DIDIT.</div>
           <div className="text-xl font-serif font-black tracking-tighter">TERRAVIO</div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="market" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">The Marketplace</h2>
            <h3 className="text-4xl md:text-5xl font-serif text-slate-900">Curated Asset Classes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <AssetCard 
              icon={<Building2 className="w-7 h-7" />}
              title="Real Estate"
              description="Direct ownership of high-yield residential and commercial properties with monthly yield distribution."
              stats="8.4% APY"
              image="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
            />
            <AssetCard 
              icon={<Coins className="w-7 h-7" />}
              title="Physical Gold"
              description="LBMA-certified physical gold vaulted in secure institutional facilities, tokenized with 1:1 backing."
              stats="Inflation Hedge"
              image="https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&q=80&w=800"
            />
            <AssetCard 
              icon={<Leaf className="w-7 h-7" />}
              title="Carbon Credits"
              description="High-integrity nature-based carbon removals verified by global environmental standards."
              stats="High Growth"
              image="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800"
            />
          </div>
        </div>
      </section>

      {/* Yield Calculator */}
      <section className="px-6 py-32 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">Financial Modeling</h2>
              <h3 className="text-4xl font-serif text-slate-900 mb-8 leading-tight">Project Your <br /> Future Wealth.</h3>
              <p className="text-slate-500 mb-10 leading-relaxed font-light">
                Use our real-time yield simulator to estimate your monthly and annual earnings based on our current institutional registry performance.
              </p>
              <div className="flex gap-4">
                 <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compounding Daily</div>
                 <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Lock-up Period</div>
              </div>
            </div>
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xl">
               <YieldCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="px-6 py-32 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">Investment Lifecycle</h2>
              <h3 className="text-4xl font-serif text-slate-900 mb-10 leading-tight">Simplified On-Chain <br /> Wealth Management.</h3>
              
              <div className="space-y-12">
                <ProcessStep 
                  number="01"
                  title="Verified Onboarding"
                  description="Complete a one-time identity verification to unlock institutional-grade opportunities."
                />
                <ProcessStep 
                  number="02"
                  title="Asset Selection"
                  description="Browse our curated registry and select assets that align with your portfolio goals."
                />
                <ProcessStep 
                  number="03"
                  title="Automated Yield"
                  description="Earnings are distributed automatically to your wallet in real-time as they are generated."
                />
              </div>
            </div>
            <div className="relative group perspective-1000">
              <motion.div 
                initial={{ rotateY: -5, rotateX: 5 }}
                whileHover={{ rotateY: 0, rotateX: 0 }}
                className="aspect-[16/10] bg-white rounded-xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200 relative z-10 flex flex-col transition-all duration-700"
              >
                {/* Browser Header */}
                <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2 flex-shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="mx-auto w-1/2 h-5 bg-white rounded border border-slate-200 flex items-center px-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    <div className="text-[8px] text-slate-400 font-mono">terravio.app/dashboard</div>
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Mock Sidebar */}
                  <div className="w-16 border-r border-slate-100 bg-slate-50 flex flex-col items-center py-6 gap-6">
                    <div className="w-8 h-8 rounded bg-[#C5A059] flex items-center justify-center mb-4">
                      <span className="text-[10px] font-serif font-black text-white">T</span>
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-slate-200/50" />
                    ))}
                  </div>

                  {/* Mock Content Area */}
                  <div className="flex-1 p-6 bg-white overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                         <div className="w-24 h-4 bg-slate-900 rounded-sm mb-1" />
                         <div className="w-32 h-2 bg-slate-200 rounded-sm" />
                      </div>
                      <div className="w-20 h-8 bg-[#C5A059] rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="h-24 rounded-xl bg-slate-50 border border-slate-100 p-4">
                         <div className="w-12 h-2 bg-slate-300 rounded-full mb-3" />
                         <div className="w-20 h-5 bg-slate-900 rounded-sm" />
                      </div>
                      <div className="h-24 rounded-xl bg-slate-50 border border-slate-100 p-4">
                         <div className="w-12 h-2 bg-slate-300 rounded-full mb-3" />
                         <div className="w-20 h-5 bg-[#C5A059] rounded-sm" />
                      </div>
                    </div>

                    <div className="space-y-4">
                       <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded bg-slate-200" />
                             <div className="w-32 h-3 bg-slate-400 rounded-sm" />
                          </div>
                          <div className="w-12 h-3 bg-[#C5A059]/40 rounded-sm" />
                       </div>
                       <div className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-6 h-6 rounded bg-slate-200" />
                             <div className="w-24 h-3 bg-slate-400 rounded-sm" />
                          </div>
                          <div className="w-12 h-3 bg-[#C5A059]/40 rounded-sm" />
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced floating element */}
              <motion.div 
                initial={{ x: 20, y: 20 }}
                animate={{ x: 0, y: 0 }}
                className="absolute -bottom-12 -right-12 w-72 h-40 bg-slate-900 rounded-2xl p-8 text-white z-20 shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-slate-800"
              >
                 <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Vault</span>
                 </div>
                 <div className="text-4xl font-serif text-[#C5A059] mb-2">$4,290,120</div>
                 <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Consolidated TVL</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust / Compliance Section */}
      <section id="compliance" className="px-6 py-32 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 w-full order-2 lg:order-1">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                   <ShieldCheck className="w-8 h-8 text-[#C5A059] mb-4" />
                   <h4 className="font-bold text-slate-900 mb-2">Legal Security</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">Full legal wrappers for every on-chain asset class.</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-xl text-white">
                   <Database className="w-8 h-8 text-[#C5A059] mb-4" />
                   <h4 className="font-bold mb-2">Live Valuation</h4>
                   <p className="text-xs text-slate-400 leading-relaxed">Automated price feeds ensure accurate market value.</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                   <Lock className="w-8 h-8 text-[#C5A059] mb-4" />
                   <h4 className="font-bold text-slate-900 mb-2">Non-Custodial</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">Your assets remain under your control at all times.</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                   <Activity className="w-8 h-8 text-[#C5A059] mb-4" />
                   <h4 className="font-bold text-slate-900 mb-2">High Yield</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">Optimized strategies for consistent ROI.</p>
                </div>
             </div>
          </div>
          <div className="flex-1 order-1 lg:order-2">
            <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">Security First</h2>
            <h3 className="text-4xl font-serif text-slate-900 mb-8 leading-tight">Infrastructure Built for <br /> Institutional Trust.</h3>
            <p className="text-slate-500 mb-10 leading-relaxed">
              We bridge the gap between traditional finance and decentralized infrastructure. Every transaction is secured by immutable ledger technology and verified by independent third-party custodians.
            </p>
            <ul className="space-y-4">
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Whitelisted Investor Network
               </li>
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Asset Backing Verification
               </li>
               <li className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Regulatory-Ready Signatures
               </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 py-32 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.3em] mb-4">Knowledge Base</h2>
            <h3 className="text-4xl font-serif text-slate-900">Common Questions</h3>
          </div>
          
          <div className="space-y-4">
             <FaqItem 
               question="How is the value of the assets determined?"
               answer="We use automated data feeds provided by Chainlink to fetch real-world valuations from audited sources. This ensures the price you see is always accurate and up-to-date."
             />
             <FaqItem 
               question="Is my investment liquid?"
               answer="Yes, tokenized assets can be traded or transferred peer-to-peer on the blockchain instantly, providing significantly more liquidity than traditional RWA investments."
             />
             <FaqItem 
               question="Who can invest on Terravio?"
               answer="Terravio is open to verified individuals who complete our identity verification process. This ensures we maintain a compliant and secure environment for all participants."
             />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-32 bg-[#C5A059] text-white overflow-hidden relative">
         <div className="max-w-7xl mx-auto relative z-10 text-center">
            <h2 className="text-5xl md:text-7xl font-serif mb-10">Start Your Portfolio Today.</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <button 
                 onClick={login}
                 className="h-16 px-12 rounded-xl bg-white text-[#C5A059] font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition-all shadow-2xl"
               >
                 Create Free Account
               </button>
               <button className="h-16 px-12 rounded-xl border-2 border-white text-white font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-[#C5A059] transition-all">
                 Read whitepaper
               </button>
            </div>
         </div>
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 w-[400px] h-[400px] border border-white/20 rounded-full translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] border border-white/20 rounded-full -translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Footer */}
      <footer className="px-6 py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-6">
                <div className="w-7 h-7 rounded bg-[#C5A059] flex items-center justify-center">
                  <span className="text-white font-serif font-black text-xs">T</span>
                </div>
                <span className="text-lg font-serif font-bold tracking-tight text-slate-900">Terravio</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8 font-light">
                Unlocking institutional-grade real world assets for the global economy. Built on the foundation of transparency and security.
              </p>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#C5A059] transition-colors cursor-pointer"><Globe className="w-4 h-4" /></div>
                 <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#C5A059] transition-colors cursor-pointer"><Activity className="w-4 h-4" /></div>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Protocol</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-700">
                <li><a href="#market" className="hover:text-[#C5A059]">Marketplace</a></li>
                <li><a href="#process" className="hover:text-[#C5A059]">Yield Engine</a></li>
                <li><a href="#compliance" className="hover:text-[#C5A059]">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Resources</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-700">
                <li><a href="#" className="hover:text-[#C5A059]">Whitepaper</a></li>
                <li><a href="#" className="hover:text-[#C5A059]">API Documentation</a></li>
                <li><a href="#" className="hover:text-[#C5A059]">Registry</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            <p>&copy; 2026 Terravio Asset Management. All rights reserved.</p>
            <div className="flex gap-10">
               <a href="#" className="hover:text-slate-900">Privacy Policy</a>
               <a href="#" className="hover:text-slate-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function YieldCalculator() {
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(5);
  const rate = 0.084; // 8.4% avg

  const total = amount * Math.pow(1 + rate, years);
  const monthly = (total - amount) / (years * 12);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investment Amount</span>
          <span className="text-lg font-bold text-slate-900">${amount.toLocaleString()}</span>
        </div>
        <input 
          type="range" 
          min="1000" 
          max="100000" 
          step="1000"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
        />
      </div>

      <div>
        <div className="flex justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Horizon</span>
          <span className="text-lg font-bold text-slate-900">{years} Years</span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="20" 
          step="1"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
        />
      </div>

      <div className="pt-8 border-t border-slate-100">
         <div className="grid grid-cols-2 gap-8">
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Monthly</div>
               <div className="text-2xl font-serif text-emerald-600">${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
               <div className="text-2xl font-serif text-slate-900">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
         </div>
      </div>

      <button className="w-full h-12 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
         Unlock this yield
      </button>
    </div>
  );
}

function AssetCard({ icon, title, description, stats, image }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  stats: string,
  image: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all group overflow-hidden flex flex-col">
      <div className="h-48 w-full overflow-hidden relative">
         <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
         <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-all" />
      </div>
      <div className="p-8 flex-1 flex flex-col">
        <div className="text-[#C5A059] mb-6 bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl group-hover:bg-[#C5A059] group-hover:text-white transition-all">
          {icon}
        </div>
        <h4 className="text-2xl font-serif text-slate-900 mb-4">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed mb-8 font-light flex-1">
          {description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</span>
          <span className="text-[#C5A059] font-bold text-sm tracking-tight">{stats}</span>
        </div>
      </div>
    </div>
  );
}

function ProcessStep({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-8 group">
      <div className="text-5xl font-serif text-slate-100 group-hover:text-[#C5A059]/10 transition-colors leading-none">{number}</div>
      <div>
        <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed font-light">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
       >
          <span className="font-bold text-slate-900 text-sm">{question}</span>
          {isOpen ? <Minus className="w-4 h-4 text-[#C5A059]" /> : <Plus className="w-4 h-4 text-[#C5A059]" />}
       </button>
       {isOpen && (
         <div className="px-8 pb-6 text-sm text-slate-500 leading-relaxed font-light border-t border-slate-50 pt-4">
            {answer}
         </div>
       )}
    </div>
  );
}
