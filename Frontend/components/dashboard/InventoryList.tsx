"use client";

interface InventoryListProps {
  assets: any[];
}

export function InventoryList({ assets }: InventoryListProps) {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Underlying Asset Inventory</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Collateral & RWA Registry</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Oracle Verified</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assets.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 group hover:border-slate-300 transition-all">
             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
             </div>
             <p className="text-xs font-bold uppercase tracking-[0.2em]">Authenticating Assets...</p>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-tighter shadow-lg group-hover:rotate-12 transition-transform">
                  {asset.kind.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Asset ID</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{asset.externalId}</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Quantity</span>
                  <span className="text-xs font-bold text-slate-900">
                    {asset.quantity?.toLocaleString()} {asset.kind === 'gold' ? 'g' : asset.kind === 'carbon' ? 'Credits' : 'Units'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authentication</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-medium italic truncate">
                  {asset.metadata?.location || asset.metadata?.project || 'Global Sovereign Registry'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
