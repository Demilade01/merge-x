import { CssBaseline, GeistProvider } from '@geist-ui/core';
import type { AppProps } from 'next/app';
import NextHead from 'next/head';
import GithubCorner from 'react-github-corner';
// @ts-ignore
import '../styles/globals.css';

// Imports
import {
  configureChains,
  createConfig,
  mainnet,
  // createClient,
  WagmiConfig,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import {
  arbitrum,
  base,
  avalanche,
  bsc,
  fantom,
  gnosis,
  optimism,
  polygon,
} from 'viem/chains';
import { z } from 'zod';
import { useIsMounted } from '../hooks';

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

const { chains, publicClient } = configureChains(
  [mainnet, polygon, optimism, arbitrum, bsc, gnosis, base, avalanche, fantom],
  [publicProvider()],
);

const { connectors } = getDefaultWallets({
  appName: 'Merge-X',
  projectId: walletConnectProjectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
});

const App = ({ Component, pageProps }: AppProps) => {
  const isMounted = useIsMounted();

  if (!isMounted) return null;
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          coolMode
          chains={chains}
          modalSize="compact"
          initialChain={mainnet}
        >
          <NextHead>
            <title>Merge-X</title>
            <meta
              name="description"
              content="Batch-transfer selected ERC-20 tokens from one EVM wallet to another with ENS support."
            />
            <link rel="icon" href="/favicon.ico" />
          </NextHead>
          <GeistProvider>
            <CssBaseline />
            <Component {...pageProps} />
          </GeistProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
};

export default App;
