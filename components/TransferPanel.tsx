import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { erc20ABI } from 'wagmi';
import { motion } from 'framer-motion';
import { isAddress } from 'essential-eth';
import { useAtom } from 'jotai';
import { normalize } from 'viem/ens';
import { checkedTokensAtom } from '../src/atoms/checked-tokens-atom';
import { destinationAddressAtom } from '../src/atoms/destination-address-atom';
import { globalTokensAtom } from '../src/atoms/global-tokens-atom';
import { TransferModal } from './TransferModal';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const TransferPanel = () => {
  const [destinationAddress, setDestinationAddress] = useAtom(
    destinationAddressAtom,
  );
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tokens] = useAtom(globalTokensAtom);
  const [checkedRecords] = useAtom(checkedTokensAtom);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const tokensToSend = Object.entries(checkedRecords)
    .filter(([_, { isChecked }]) => isChecked)
    .map(([tokenAddress]) => {
      const token = tokens.find((t) => t.contract_address === tokenAddress);
      return { address: tokenAddress as `0x${string}`, token };
    });

  const totalValue = tokensToSend.reduce(
    (sum, { token }) => sum + (token?.quote || 0),
    0,
  );

  // Resolve ENS name
  useEffect(() => {
    const resolveENS = async () => {
      if (!destinationAddress || !publicClient) return;

      if (destinationAddress.includes('.')) {
        setIsResolving(true);
        try {
          const resolved = await publicClient.getEnsAddress({
            name: normalize(destinationAddress),
          });
          if (resolved) {
            setResolvedAddress(resolved);
            setEnsName(destinationAddress);
          } else {
            setResolvedAddress(null);
            setEnsName(null);
          }
        } catch (error) {
          setResolvedAddress(null);
          setEnsName(null);
        } finally {
          setIsResolving(false);
        }
      } else if (isAddress(destinationAddress)) {
        setResolvedAddress(destinationAddress);
        // Try to get ENS name
        try {
          const name = await publicClient.getEnsName({
            address: destinationAddress as `0x${string}`,
          });
          setEnsName(name || null);
        } catch {
          setEnsName(null);
        }
      } else {
        setResolvedAddress(null);
        setEnsName(null);
      }
    };

    resolveENS();
  }, [destinationAddress, publicClient]);

  const addressAppearsValid =
    typeof destinationAddress === 'string' &&
    (destinationAddress.includes('.') || isAddress(destinationAddress));

  const checkedCount = tokensToSend.length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 space-y-6 overflow-hidden"
      >
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Transfer
        </h2>

        {/* Destination Input */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Destination Address</label>
          <div className="relative w-full">
            <input
              type="text"
              value={destinationAddress || ''}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="vitalik.eth or 0x..."
              className={`
                w-full max-w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl
                px-4 py-3 text-white placeholder-white/40 box-border
                focus:outline-none focus:ring-2 focus:bg-white/10 focus:border-white/20 transition-all
                ${
                  addressAppearsValid
                    ? 'focus:ring-green-500/50'
                    : destinationAddress && destinationAddress.length > 0
                      ? 'focus:ring-red-500/50'
                      : 'focus:ring-blue-500/50'
                }
              `}
            />
            {isResolving && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Resolved Address Display */}
          {resolvedAddress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                {ensName && (
                  <p className="font-medium text-green-300 truncate">
                    {ensName}
                  </p>
                )}
                <p className="font-mono text-xs text-white/60 truncate">
                  {resolvedAddress}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Summary */}
        {checkedCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3 pt-4 border-t border-white/10"
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Tokens Selected</span>
              <span className="font-semibold text-white">{checkedCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total Value</span>
              <span className="font-semibold text-white">
                {usdFormatter.format(totalValue)}
              </span>
            </div>
          </motion.div>
        )}

        {/* Send Button */}
        <button
          onClick={() => setShowModal(true)}
          disabled={
            !addressAppearsValid || checkedCount === 0 || !resolvedAddress
          }
          className={`
            w-full py-4 rounded-xl font-semibold transition-all duration-200
            ${
              addressAppearsValid && checkedCount > 0 && resolvedAddress
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            }
          `}
        >
          {checkedCount === 0
            ? 'Select tokens to transfer'
            : `Transfer ${checkedCount} token${checkedCount > 1 ? 's' : ''}`}
        </button>
      </motion.div>

      {/* Transfer Modal */}
      {showModal && (
        <TransferModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          tokensToSend={tokensToSend}
          destinationAddress={resolvedAddress!}
          ensName={ensName}
        />
      )}
    </>
  );
};
