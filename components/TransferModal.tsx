import { useState, useEffect } from 'react';
import { usePublicClient, useWalletClient, useNetwork } from 'wagmi';
import { erc20ABI } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { formatEther, encodeFunctionData } from 'viem';
import { checkedTokensAtom } from '../src/atoms/checked-tokens-atom';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface TokenToSend {
  address: `0x${string}`;
  token: any;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokensToSend: TokenToSend[];
  destinationAddress: string;
  ensName: string | null;
}

export const TransferModal = ({
  isOpen,
  onClose,
  tokensToSend,
  destinationAddress,
  ensName,
}: TransferModalProps) => {
  const [currentStep, setCurrentStep] = useState<
    'preview' | 'sending' | 'success'
  >('preview');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [txHashes, setTxHashes] = useState<Map<string, string>>(new Map());
  const [gasEstimate, setGasEstimate] = useState<{
    totalGas: bigint;
    totalCostNative: string;
    totalCostUSD: number;
    isLoading: boolean;
    error: string | null;
  } | null>(null);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { chain } = useNetwork();
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);

  const totalValue = tokensToSend.reduce(
    (sum, { token }) => sum + (token?.quote || 0),
    0,
  );

  // Estimate gas costs when modal opens
  useEffect(() => {
    const estimateGas = async () => {
      if (!publicClient || !walletClient || tokensToSend.length === 0) {
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
        const gasPrice = await publicClient.getGasPrice();
        let totalGas = BigInt(0);

        for (const { address: tokenAddress, token } of tokensToSend) {
          try {
            const gas = await publicClient.estimateGas({
              account: walletClient.account,
              to: tokenAddress,
              data: encodeFunctionData({
                abi: erc20ABI,
                functionName: 'transfer',
                args: [
                  destinationAddress as `0x${string}`,
                  BigInt(token?.balance || '0'),
                ],
              }),
            });
            totalGas += gas;
          } catch (error) {
            const defaultGas = BigInt(65000);
            totalGas += defaultGas;
          }
        }

        const divisor = BigInt('1000000000000000000');
        const totalCostNative = (totalGas * gasPrice) / divisor;
        const totalCostNativeFormatted = formatEther(totalCostNative);

        const nativeTokenPriceUSD =
          chain?.id === 1
            ? 2000
            : chain?.id === 137
              ? 0.7
              : chain?.id === 8453
                ? 0.0003
                : 0.5;
        const totalCostUSD =
          Number(totalCostNativeFormatted) * nativeTokenPriceUSD;

        setGasEstimate({
          totalGas,
          totalCostNative: totalCostNativeFormatted,
          totalCostUSD,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        setGasEstimate({
          totalGas: BigInt(0),
          totalCostNative: '0',
          totalCostUSD: 0,
          isLoading: false,
          error: error?.message || 'Failed to estimate gas',
        });
      }
    };

    if (isOpen) {
      estimateGas();
    }
  }, [
    isOpen,
    publicClient,
    walletClient,
    tokensToSend,
    destinationAddress,
    chain?.id,
  ]);

  const sendAllTokens = async () => {
    if (!walletClient || !publicClient) return;

    setCurrentStep('sending');
    setCurrentIndex(0);
    setCompleted(new Set());
    setFailed(new Set());
    setTxHashes(new Map());

    for (let i = 0; i < tokensToSend.length; i++) {
      setCurrentIndex(i);
      const { address: tokenAddress, token } = tokensToSend[i];

      try {
        const { request } = await publicClient.simulateContract({
          account: walletClient.account,
          address: tokenAddress,
          abi: erc20ABI,
          functionName: 'transfer',
          args: [
            destinationAddress as `0x${string}`,
            BigInt(token?.balance || '0'),
          ],
        });

        const hash = await walletClient.writeContract(request);
        setTxHashes((prev) => new Map(prev).set(tokenAddress, hash));

        // Wait for transaction
        await publicClient.waitForTransactionReceipt({ hash });
        setCompleted((prev) => new Set(prev).add(tokenAddress));
      } catch (error: any) {
        console.error(`Error sending ${token?.contract_ticker_symbol}:`, error);
        setFailed((prev) => new Set(prev).add(tokenAddress));
      }
    }

    setCurrentStep('success');
  };

  const handleClose = () => {
    if (currentStep === 'sending') return; // Prevent closing during transfer
    onClose();
    if (currentStep === 'success') {
      // Reset selections after successful transfer
      setCheckedRecords({});
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Review Transfer</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 mb-1">To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                      <span>👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {ensName && (
                        <p className="font-medium text-white truncate">
                          {ensName}
                        </p>
                      )}
                      <p className="font-mono text-sm text-white/60 truncate">
                        {destinationAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-3">
                    Tokens to Transfer
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tokensToSend.map(({ token }) => (
                      <div
                        key={token.contract_address}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <span className="text-xs">💰</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {token.contract_ticker_symbol}
                            </p>
                            <p className="text-xs text-white/60 font-mono">
                              {token.balance}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-white">
                          {usdFormatter.format(token.quote)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Value</span>
                    <span className="text-2xl font-bold text-white">
                      {usdFormatter.format(totalValue)}
                    </span>
                  </div>

                  {/* Gas Estimate */}
                  {gasEstimate && (
                    <div className="pt-3 border-t border-white/5">
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
                                : parseFloat(
                                    gasEstimate.totalCostNative,
                                  ).toFixed(6)}{' '}
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
                          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-400">
                              ⚠️ Gas cost is{' '}
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
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendAllTokens}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          )}

          {currentStep === 'sending' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Transferring Tokens</h2>
                <p className="text-white/60">
                  {currentIndex + 1} of {tokensToSend.length} transfers
                </p>
              </div>

              <div className="space-y-3">
                {tokensToSend.map(({ token, address }, index) => {
                  const isCurrent = index === currentIndex;
                  const isDone = completed.has(address);
                  const hasFailed = failed.has(address);
                  const txHash = txHashes.get(address);

                  return (
                    <div
                      key={address}
                      className={`
                        p-4 rounded-xl border transition-all
                        ${
                          isDone
                            ? 'bg-green-500/10 border-green-500/30'
                            : hasFailed
                              ? 'bg-red-500/10 border-red-500/30'
                              : isCurrent
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-white/5 border-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isDone ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : hasFailed ? (
                            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-xs">✕</span>
                            </div>
                          ) : isCurrent ? (
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10" />
                          )}
                          <div>
                            <p className="font-medium text-white">
                              {token.contract_ticker_symbol}
                            </p>
                            {txHash && chain?.blockExplorers?.default && (
                              <a
                                href={`${chain.blockExplorers.default.url}/tx/${txHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                View on Explorer
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="font-semibold text-white">
                          {usdFormatter.format(token.quote)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-4xl shadow-lg shadow-green-500/30"
              >
                ✓
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Transfer Complete!</h2>
                <p className="text-white/60">
                  {completed.size} of {tokensToSend.length} tokens transferred
                  successfully
                </p>
                {failed.size > 0 && (
                  <p className="text-red-400 mt-2">
                    {failed.size} transfer(s) failed
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-semibold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Done
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
