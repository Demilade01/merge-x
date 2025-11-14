import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useNetwork, useSwitchNetwork } from 'wagmi';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useWalletConnect } from '../hooks/useWalletConnect';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  avalanche,
  bsc,
  fantom,
  gnosis,
} from 'viem/chains';

const chains = [
  { id: mainnet.id, name: 'Ethereum', shortName: 'ETH' },
  { id: polygon.id, name: 'Polygon', shortName: 'MATIC' },
  { id: optimism.id, name: 'Optimism', shortName: 'OP' },
  { id: arbitrum.id, name: 'Arbitrum', shortName: 'ARB' },
  { id: base.id, name: 'Base', shortName: 'BASE' },
  { id: bsc.id, name: 'BSC', shortName: 'BNB' },
  { id: gnosis.id, name: 'Gnosis', shortName: 'GNO' },
  { id: avalanche.id, name: 'Avalanche', shortName: 'AVAX' },
  { id: fantom.id, name: 'Fantom', shortName: 'FTM' },
];

export const WalletPanel = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const {
    isConnected: isWCConnected,
    address: wcAddress,
    isInitializing: isWCInitializing,
    error: wcError,
    connect: wcConnect,
    disconnect: wcDisconnect,
    utils: wcUtils,
  } = useWalletConnect();

  // ENS is only supported on Ethereum mainnet (chainId 1)
  const supportsENS = chain?.id === 1;
  const [ensName, setEnsName] = useState<string | null>(null);

  // Only fetch ENS name on Ethereum mainnet - with strict guards and error handling
  // Completely disable the hook when not on Ethereum mainnet
  const isEthereumMainnet = chain?.id === 1;
  const shouldFetchENS = isEthereumMainnet && !!address && !!chain;

  const { data: fetchedEnsName, error: ensError } = useEnsName({
    address: shouldFetchENS ? address : undefined,
    enabled: shouldFetchENS,
    onError: (error) => {
      // Silently handle ENS errors - don't let them break the UI
      setEnsName(null);
      // Only log if we're actually on Ethereum (unexpected error)
      if (isEthereumMainnet) {
        console.debug('ENS resolution error:', error);
      }
    },
  });

  // Immediately clear ENS when switching away from Ethereum
  useEffect(() => {
    if (chain?.id !== 1) {
      setEnsName(null);
    }
  }, [chain?.id]);

  // Update local state only when ENS is supported
  useEffect(() => {
    // Don't update if not on Ethereum
    if (!supportsENS || chain?.id !== 1) {
      return;
    }

    if (fetchedEnsName && !ensError) {
      setEnsName(fetchedEnsName);
    } else {
      setEnsName(null);
    }
  }, [supportsENS, fetchedEnsName, ensError, chain?.id]);

  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Wallet Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Wallet
          </h2>
          <div className="flex items-center gap-2">
            {/* WalletConnect Button */}
            {!isWCConnected ? (
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  wcConnect().catch(() => {
                    // Error is handled by the hook
                  });
                }}
                disabled={isWCInitializing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-4 py-2 rounded-lg text-xs font-semibold transition-all
                  ${
                    isWCInitializing
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/20'
                  }
                `}
              >
                {isWCInitializing ? 'Connecting...' : 'WalletConnect'}
              </motion.button>
            ) : (
              <motion.button
                onClick={wcDisconnect}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-all"
              >
                Disconnect WC
              </motion.button>
            )}
            <ConnectButton showBalance={false} />
          </div>
        </div>
        {/* RainbowKit Connection */}
        {isConnected && address && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white/80 mb-1">
                RainbowKit Address
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  {ensName ? (
                    <p className="font-medium truncate">{ensName}</p>
                  ) : (
                    <p className="font-mono text-sm font-medium text-white truncate">
                      {formatAddress(address)}
                    </p>
                  )}
                  {ensName && (
                    <p className="font-mono text-xs text-white/50 truncate">
                      {formatAddress(address)}
                    </p>
                  )}
                </div>
                <motion.button
                  onClick={copyAddress}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-white/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* WalletConnect Connection */}
        {isWCConnected && wcAddress && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-sm font-medium text-white/80 mb-1">
                WalletConnect Address
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                  <span className="text-xs">🔗</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-white truncate">
                    {wcUtils.formatAddress(wcAddress)}
                  </p>
                </div>
                <motion.button
                  onClick={async () => {
                    if (wcAddress) {
                      await navigator.clipboard.writeText(wcAddress);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : (
                    <svg
                      className="w-4 h-4 text-white/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </motion.button>
              </div>
            </div>
            {wcError && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-2">
                <p className="text-xs text-red-400 font-semibold">
                  Connection Error:
                </p>
                <p className="text-xs text-red-300">{wcError}</p>
                {wcError.includes('WebSocket') ||
                wcError.includes('Socket') ||
                wcError.includes('network') ? (
                  <div className="mt-2 pt-2 border-t border-red-500/20">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">
                      Troubleshooting:
                    </p>
                    <ul className="text-xs text-yellow-300 space-y-1 list-disc list-inside">
                      <li>
                        Check if firewall/proxy is blocking WebSocket
                        connections
                      </li>
                      <li>
                        Try a different network (mobile hotspot, different WiFi)
                      </li>
                      <li>Disable VPN if active</li>
                      <li>Check corporate network restrictions</li>
                      <li>
                        Try again in a few minutes (relay servers may be
                        temporarily unavailable)
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
        {!isConnected && !isWCConnected && (
          <div className="space-y-2">
            <p className="text-sm text-white/50 text-center py-4">
              Connect your wallet to get started
            </p>
            {process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ===
              'demo-project-id' && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  ⚠️ Warning: Using demo WalletConnect Project ID. Set
                  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in .env.local
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Chain Selector */}
      {(isConnected || isWCConnected) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <h3 className="text-sm font-semibold mb-3 text-white/90">Network</h3>
          <div className="grid grid-cols-3 gap-2">
            {chains.map((chainOption) => {
              const isActive = chain?.id === chainOption.id;
              return (
                <motion.button
                  key={chainOption.id}
                  onClick={() => switchNetwork?.(chainOption.id)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-semibold transition-all text-white
                    ${
                      isActive
                        ? 'bg-white/10 border border-white/20 shadow-lg shadow-white/5'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white/90'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {chainOption.shortName}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};
