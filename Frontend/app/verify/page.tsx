"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Loader2, ChevronRight, ArrowLeft, CheckCircle2, UserCheck, Smartphone } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const handleStartVerification = async () => {
    setIsStarting(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert("Session expired. Please sign in again.");
        setIsStarting(false);
        return;
      }
      
      const email = user?.email?.address || user?.linkedAccounts.find(a => a.type === 'email')?.address;
      const wallet = user?.wallet?.address || user?.linkedAccounts.find(a => a.type === 'wallet')?.address;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, wallet })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Connection failed.'}`);
      }
    } catch (error) {
      alert("A system error occurred. Please try again later.");
    } finally {
      setIsStarting(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <nav className="w-full bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-10">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-slate-200">
              <Shield className="w-6 h-6 text-white stroke-[1.5]" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Identity Verification</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-10">
              To ensure the security of our institutional registry, we require a standard identity verification. This process is secure and only takes a few minutes.
            </p>

            <div className="space-y-6 mb-10">
              <div className="flex gap-4 items-start">
                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Government ID</h3>
                  <p className="text-xs text-slate-500">Scan your passport or driver's license.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Biometric Scan</h3>
                  <p className="text-xs text-slate-500">Quick 3D face scan to verify liveness.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Instant Activation</h3>
                  <p className="text-xs text-slate-500">Auto-whitelisting on the protocol upon success.</p>
                </div>
              </div>
            </div>

            <button 
              className="w-full h-14 bg-slate-900 text-white font-semibold rounded-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:cursor-not-allowed group shadow-md shadow-slate-100"
              onClick={handleStartVerification}
              disabled={isStarting}
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Start Identity Verification
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 px-10 py-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secured by Didit</span>
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="w-1 h-1 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
