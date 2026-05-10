"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
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
        alert("Session expired.");
        setIsStarting(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kyc/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Error: ${data.error || 'Check connection.'}`);
      }
    } catch (error) {
      alert("System error. Please retry.");
    } finally {
      setIsStarting(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6">
      <Link href="/dashboard" className="fixed top-12 left-12 flex items-center gap-2 text-slate-300 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
      </Link>

      <div className="w-full max-w-sm text-center">
        <div className="mb-10 flex justify-center">
          <Shield className="w-12 h-12 text-slate-900 stroke-[1]" />
        </div>

        <h1 className="text-3xl font-serif italic mb-4 tracking-tight">Identity Attestation</h1>
        <p className="text-slate-400 text-[11px] uppercase tracking-[0.2em] font-bold mb-12">
          Regulatory Compliance Required
        </p>

        <button 
          className="w-full h-16 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-4 group disabled:bg-slate-100"
          onClick={handleStartVerification}
          disabled={isStarting}
        >
          {isStarting ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              Start Verification
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        
        <p className="mt-8 text-[9px] text-slate-300 uppercase tracking-widest font-bold">
          Verified by Didit Protocol
        </p>
      </div>
    </div>
  );
}
