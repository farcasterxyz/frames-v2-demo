"use client";

import dynamic from "next/dynamic";

import SolanaProvider from '~/components/providers/SolanaProvider'

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider>
      <SolanaProvider>
        {children}
      </SolanaProvider>
    </WagmiProvider>
  );
}
