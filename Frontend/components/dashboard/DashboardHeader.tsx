"use client";

import { usePrivy } from "@privy-io/react-auth";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { user } = usePrivy();

  return (
    <header className="h-24 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-30">
      <div className="flex flex-col pl-14 lg:pl-0">
        <h1 className="text-lg lg:text-2xl font-serif font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
        <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
    </header>
  );
}
