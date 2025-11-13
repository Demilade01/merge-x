import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useNetwork, useSwitchNetwork } from 'wagmi';
import { motion } from 'framer-motion';
import { mainnet, polygon, optimism, arbitrum, bsc, gnosis } from 'viem/chains';
import { useState } from 'react';

const chains = [
  { id: mainnet.id, name: 'Ethereum', shortName: 'ETH' },
  { id: polygon.id, name: 'Polygon', shortName: 'MATIC' },
  { id: optimism.id, name: 'Optimism', shortName: 'OP' },
  { id: arbitrum.id, name: 'Arbitrum', shortName: 'ARB' },
  { id: bsc.id, name: 'BSC', shortName: 'BNB' },
  { id: gnosis.id, name: 'Gnosis', shortName: 'GNO' },
];

export const WalletPanel = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { data: ensName } = useEnsName({ address });

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
          <ConnectButton showBalance={false} />
        </div>
        {isConnected && address && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white/80 mb-1">Address</p>
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
        {!isConnected && (
          <p className="text-sm text-white/50 text-center py-4">
            Connect your wallet to get started
          </p>
        )}
      </motion.div>

      {/* Chain Selector */}
      {isConnected && (
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
