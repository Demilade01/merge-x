import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { globalTokensAtom } from '../src/atoms/global-tokens-atom';
import { useAccount } from 'wagmi';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const PortfolioStats = () => {
  const [tokens] = useAtom(globalTokensAtom);
  const { isConnected } = useAccount();

  const totalPortfolioValue = tokens.reduce(
    (sum, token) => sum + (token.quote || 0),
    0,
  );

  const tokenCount = tokens.length;

  if (!isConnected || tokenCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/60 mb-1">Total Portfolio Value</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {usdFormatter.format(totalPortfolioValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/60 mb-1">Tokens</p>
          <p className="text-xl font-semibold text-white">{tokenCount}</p>
        </div>
      </div>
    </motion.div>
  );
};
