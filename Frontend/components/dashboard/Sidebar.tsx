"use client";

import { usePrivy } from "@privy-io/react-auth";
import { 
  Wallet, 
  LogOut, 
  Activity,
  History,
  TrendingUp,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const { user, logout } = usePrivy();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const links = [
    { icon: Activity, label: "Overview", href: "/dashboard" },
    { icon: Wallet, label: "Portfolio", href: "/dashboard/portfolio" },
    { icon: TrendingUp, label: "Marketplace", href: "/dashboard/marketplace" },
    { icon: History, label: "Transactions", href: "/dashboard/transactions" },
  ];

  const secondaryLinks = [
    { icon: Globe, label: "Network", href: "/dashboard/network" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <>
      {/* Mobile Toggle Button - Only visible on mobile when sidebar is closed */}
      {!isMobileOpen && (
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-6 left-6 z-[60] w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[50]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -280 : 0)
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`bg-white border-r border-slate-200 flex flex-col fixed lg:sticky top-0 h-screen z-[55] lg:z-40 shadow-2xl lg:shadow-none transition-transform lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200 shrink-0">
              <span className="text-white font-serif font-black text-lg">T</span>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <span className="text-xl font-serif font-bold tracking-tight text-slate-900 leading-none">Terravio</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">RWA Protocol</span>
              </motion.div>
            )}
          </Link>
          
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
            )}
            <nav className="space-y-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
                      isActive 
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#C5A059]" : "text-slate-400 group-hover:text-slate-600"}`} />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-sm font-semibold tracking-tight">{link.label}</span>
                    )}
                    {isActive && (!isCollapsed || isMobileOpen) && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#C5A059]"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">System</p>
            )}
            <nav className="space-y-1">
              {secondaryLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive 
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#C5A059]" : "text-slate-400 group-hover:text-slate-600"}`} />
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="text-sm font-semibold tracking-tight">{link.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 mt-auto border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 ${(isCollapsed && !isMobileOpen) ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm shrink-0">
              <Wallet className="w-5 h-5 text-[#C5A059]" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Wallet</p>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
                </p>
              </div>
            )}
          </div>
          
          <button 
            onClick={logout}
            className={`w-full h-11 mt-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 group ${(isCollapsed && !isMobileOpen) ? 'px-0' : 'px-4'}`}
          >
            <LogOut className="w-4 h-4 group-hover:text-red-500 transition-colors" />
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle - Desktop Only */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  );
}
