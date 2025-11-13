import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsName, useNetwork, useSwitchNetwork } from 'wagmi';
import { motion } from 'framer-motion';
import { mainnet, polygon, optimism, arbitrum, bsc, gnosis } from 'viem/chains';

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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
          <h2 className="text-xl font-semibold">Wallet</h2>
          <ConnectButton showBalance={false} />
        </div>
        {isConnected && address && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-white/60 mb-1">Address</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
                <div>
                  {ensName ? (
                    <p className="font-medium">{ensName}</p>
                  ) : (
                    <p className="font-mono text-sm">
                      {formatAddress(address)}
                    </p>
                  )}
                  {ensName && (
                    <p className="font-mono text-xs text-white/50">
                      {formatAddress(address)}
                    </p>
                  )}
                </div>
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
          <h3 className="text-sm font-medium mb-3 text-white/80">Network</h3>
          <div className="grid grid-cols-3 gap-2">
            {chains.map((chainOption) => {
              const isActive = chain?.id === chainOption.id;
              return (
                <motion.button
                  key={chainOption.id}
                  onClick={() => switchNetwork?.(chainOption.id)}
                  className={`
                    px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${
                      isActive
                        ? 'bg-white/10 border border-white/20 shadow-lg shadow-white/5'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
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
