import { FarcasterSolanaProvider } from '@farcaster/mini-app-solana';

// This is a free RPC without credit card linked, steal at your own will
const heliusEndpoint = 'https://mainnet.helius-rpc.com/?api-key=63185c9d-1a75-492a-ba9c-2dbac8e9434d';

export default function SolanaProvider({ children }: { children: React.ReactNode }) {
  return (
    <FarcasterSolanaProvider endpoint={heliusEndpoint}>
      {children}
    </FarcasterSolanaProvider>
  );
}
