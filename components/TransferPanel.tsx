import { useState, useEffect } from 'react';
import {
  useAccount,
  useNetwork,
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { erc20ABI } from 'wagmi';
import { motion } from 'framer-motion';
import { isAddress } from 'essential-eth';
import { useAtom } from 'jotai';
import { formatEther, encodeFunctionData } from 'viem';
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
  const [gasEstimate, setGasEstimate] = useState<{
    totalGas: bigint;
    totalCostNative: string;
    totalCostUSD: number;
    gasPrice: bigint;
    isLoading: boolean;
    error: string | null;
  } | null>(null);
  const [tokens] = useAtom(globalTokensAtom);
  const [checkedRecords] = useAtom(checkedTokensAtom);
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // ENS is only supported on Ethereum mainnet (chainId 1)
  const supportsENS = chain?.id === 1;

  // Clear ENS addresses when switching to non-ENS networks
  useEffect(() => {
    if (!supportsENS && destinationAddress?.includes('.')) {
      setDestinationAddress('');
      setResolvedAddress(null);
      setEnsName(null);
    }
  }, [supportsENS, destinationAddress, setDestinationAddress]);

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

  // Estimate gas costs for all transfers
  useEffect(() => {
    const estimateGas = async () => {
      if (
        !publicClient ||
        !walletClient ||
        !resolvedAddress ||
        tokensToSend.length === 0
      ) {
        setGasEstimate(null);
        return;
      }

      setGasEstimate(
        (prev) =>
          ({
            ...prev,
            isLoading: true,
            error: null,
          }) as any,
      );

      try {
        // Get gas price
        const gasPrice = await publicClient.getGasPrice();

        // Estimate gas for each token transfer
        let totalGas = BigInt(0);
        const gasEstimates: bigint[] = [];

        for (const { address: tokenAddress, token } of tokensToSend) {
          try {
            const gas = await publicClient.estimateGas({
              account: walletClient.account,
              to: tokenAddress,
              data: encodeFunctionData({
                abi: erc20ABI,
                functionName: 'transfer',
                args: [
                  resolvedAddress as `0x${string}`,
                  BigInt(token?.balance || '0'),
                ],
              }),
            });
            gasEstimates.push(gas);
            totalGas += gas;
          } catch (error) {
            // If estimation fails, use a default value (65,000 is typical for ERC-20 transfers)
            const defaultGas = BigInt(65000);
            gasEstimates.push(defaultGas);
            totalGas += defaultGas;
          }
        }

        // Calculate total cost in native token
        // 10^18 = 1000000000000000000
        const divisor = BigInt('1000000000000000000');
        const totalCostNative = (totalGas * gasPrice) / divisor;
        const totalCostNativeFormatted = formatEther(totalCostNative);

        // Estimate USD value (rough approximation: use a default price or fetch from API)
        // For now, we'll use a simple multiplier based on chain
        // You could enhance this by fetching native token price from an API
        const nativeTokenPriceUSD =
          chain?.id === 1
            ? 2000
            : chain?.id === 137
              ? 0.7
              : chain?.id === 8453
                ? 0.0003
                : 0.5; // Rough estimates
        const totalCostUSD =
          Number(totalCostNativeFormatted) * nativeTokenPriceUSD;

        setGasEstimate({
          totalGas,
          totalCostNative: totalCostNativeFormatted,
          totalCostUSD,
          gasPrice,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setGasEstimate({
          totalGas: BigInt(0),
          totalCostNative: '0',
          totalCostUSD: 0,
          gasPrice: BigInt(0),
          isLoading: false,
          error: error?.message || 'Failed to estimate gas',
        });
      }
    };

    estimateGas();
  }, [publicClient, walletClient, resolvedAddress, tokensToSend, chain?.id]);

  // Resolve ENS name (only on Ethereum mainnet)
  useEffect(() => {
    const resolveENS = async () => {
      if (!destinationAddress || !publicClient) return;

      if (destinationAddress.includes('.')) {
        // ENS names only work on Ethereum mainnet
        if (!supportsENS) {
          setResolvedAddress(null);
          setEnsName(null);
          return;
        }
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
        // Try to get ENS name (only on Ethereum mainnet)
        if (supportsENS) {
          try {
            const name = await publicClient.getEnsName({
              address: destinationAddress as `0x${string}`,
            });
            setEnsName(name || null);
          } catch {
            setEnsName(null);
          }
        } else {
          setEnsName(null);
        }
      } else {
        setResolvedAddress(null);
        setEnsName(null);
      }
    };

    resolveENS();
  }, [destinationAddress, publicClient, supportsENS]);

  const addressAppearsValid =
    typeof destinationAddress === 'string' &&
    (supportsENS
      ? destinationAddress.includes('.') || isAddress(destinationAddress)
      : isAddress(destinationAddress));

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
              placeholder={
                supportsENS
                  ? 'vitalik.eth or 0x...'
                  : '0x... (ENS not supported on this network)'
              }
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

            {/* Gas Estimate */}
            {gasEstimate && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/60">Estimated Gas</span>
                  {gasEstimate.isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : gasEstimate.error ? (
                    <span className="text-red-400 text-xs">
                      Estimation failed
                    </span>
                  ) : (
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        {parseFloat(gasEstimate.totalCostNative) < 0.0001
                          ? '< 0.0001'
                          : parseFloat(gasEstimate.totalCostNative).toFixed(
                              6,
                            )}{' '}
                        {chain?.nativeCurrency?.symbol || 'ETH'}
                      </div>
                      <div className="text-xs text-white/50">
                        ~{usdFormatter.format(gasEstimate.totalCostUSD)}
                      </div>
                    </div>
                  )}
                </div>
                {gasEstimate &&
                  !gasEstimate.isLoading &&
                  !gasEstimate.error &&
                  gasEstimate.totalCostUSD > totalValue * 0.1 && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs text-yellow-400">
                        ⚠️ Gas cost (
                        {usdFormatter.format(gasEstimate.totalCostUSD)}) is{' '}
                        {(
                          (gasEstimate.totalCostUSD / totalValue) *
                          100
                        ).toFixed(1)}
                        % of total value
                      </p>
                    </div>
                  )}
              </div>
            )}
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
