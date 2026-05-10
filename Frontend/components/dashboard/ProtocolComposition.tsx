"use client";

interface ProtocolCompositionProps {
  assets: any[];
}

export function ProtocolComposition({ assets }: ProtocolCompositionProps) {
  const colors = ["#C5A059", "#1A1A1A", "#94a3b8", "#10b981"];
  const totalQty = assets.reduce((sum, a) => sum + (a.quantity || 0), 0);

  return (
    <section className="mb-16 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
        <div className="shrink-0">
           <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-[24px] border-slate-50" />
              {/* Progress Ring (Visual representation) */}
              <div className="absolute inset-0 rounded-full border-[24px] border-[#C5A059] border-t-transparent border-r-transparent rotate-45 shadow-sm" />
              
              <div className="text-center">
                <div className="text-5xl font-serif font-bold text-slate-900 mb-1">
                  {assets.length > 0 ? "100" : "0"}
                  <span className="text-2xl ml-0.5">%</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Collateralized</div>
              </div>
           </div>
        </div>

        <div className="flex-1 w-full">
           <div className="mb-8">
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Protocol Composition</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Real-Time Asset Distribution Analysis</p>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {assets.map((asset, idx) => {
                const percentage = totalQty > 0 ? ((asset.quantity || 0) / totalQty * 100).toFixed(1) : 0;
                const color = colors[idx % colors.length];
                return (
                  <div key={asset.id} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group/item">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {asset.kind === 'gold' ? 'LBMA Gold' : asset.kind === 'property' ? 'Real Estate' : 'Carbon Credits'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-serif font-bold text-slate-900">{percentage}%</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share</span>
                    </div>
                  </div>
                );
              })}
              {assets.length === 0 && (
                <div className="col-span-full py-12 text-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">No assets synchronized from the registry</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </section>
  );
}
