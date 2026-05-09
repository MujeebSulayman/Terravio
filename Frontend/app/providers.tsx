"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "@privy-io/wagmi";
import { wagmiConfig } from "../lib/wagmi";


const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // Use a placeholder during build if the real ID is missing to prevent prerendering errors
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cl_placeholder_id";
  
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#C5A059",
          showWalletLoginFirst: true,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
