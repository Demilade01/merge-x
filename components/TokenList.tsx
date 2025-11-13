import { useCallback, useEffect, useState } from 'react';
import { useAccount, useNetwork, useWaitForTransaction } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { tinyBig } from 'essential-eth';
import { useAtom } from 'jotai';
import { checkedTokensAtom } from '../src/atoms/checked-tokens-atom';
import { globalTokensAtom } from '../src/atoms/global-tokens-atom';
import { httpFetchTokens, Tokens } from '../src/fetch-tokens';
import { PortfolioStats } from './PortfolioStats';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const TokenRow = ({ token }: { token: Tokens[number] }) => {
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const { chain } = useNetwork();
  const tokenAddress = token.contract_address as `0x${string}`;
  const pendingTxn = checkedRecords[tokenAddress]?.pendingTxn;
  const isChecked = checkedRecords[tokenAddress]?.isChecked || false;
  const { address } = useAccount();
  const [logoError, setLogoError] = useState(false);

  const unroundedBalance = tinyBig(token.quote).div(token.quote_rate);
  const roundedBalance = unroundedBalance.lt(0.001)
    ? unroundedBalance.round(10)
    : unroundedBalance.gt(1000)
      ? unroundedBalance.round(2)
      : unroundedBalance.round(5);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: pendingTxn?.blockHash || undefined,
  });

  const toggleChecked = () => {
    if (pendingTxn) return;
    setCheckedRecords((old) => ({
      ...old,
      [tokenAddress]: {
        ...old[tokenAddress],
        isChecked: !isChecked,
      },
    }));
  };

  // Better token logo URL with fallback
  const getTokenLogoUrl = () => {
    const chainName = chain?.name.toLowerCase() || 'ethereum';
    // Try Trust Wallet assets first
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chainName}/assets/${token.contract_address}/logo.png`;
  };

  const tokenLogoUrl = getTokenLogoUrl();

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={toggleChecked}
      className={`
        glass-card p-4 cursor-pointer transition-all duration-200
        ${isChecked ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''}
        ${pendingTxn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'}
      `}
      whileHover={!pendingTxn ? { scale: 1.02 } : {}}
      whileTap={!pendingTxn ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <div className="relative">
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${
                isChecked
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-white/30 bg-transparent'
              }
            `}
          >
            {isChecked && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            )}
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Token Logo */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center overflow-hidden relative">
          {!logoError && (
            <img
              src={token.logo_url || tokenLogoUrl}
              alt={token.contract_ticker_symbol}
              className="w-full h-full object-cover"
              onError={() => setLogoError(true)}
            />
          )}
          {logoError && (
            <span className="text-sm font-semibold text-white/80">
              {token.contract_ticker_symbol.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white truncate">
              {token.contract_ticker_symbol}
            </p>
            {isSuccess && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-400 text-xs"
              >
                ✓
              </motion.span>
            )}
          </div>
          <p className="text-sm text-white/60 font-mono truncate">
            {roundedBalance.toString()}
          </p>
        </div>

        {/* USD Value */}
        <div className="text-right">
          <p className="font-semibold text-white">
            {usdFormatter.format(token.quote)}
          </p>
          <a
            href={`${chain?.blockExplorers?.default.url}/token/${token.contract_address}?a=${address}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            View
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export const TokenList = () => {
  const [tokens, setTokens] = useAtom(globalTokensAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [stablesOnly, setStablesOnly] = useState(false);
  const [checkedRecords, setCheckedRecords] = useAtom(checkedTokensAtom);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  const fetchData = useCallback(async () => {
    if (!address || !chain?.id) return;
    setLoading(true);
    try {
      setError('');
      const newTokens = await httpFetchTokens(chain.id, address);
      setTokens((newTokens as any).data.erc20s);
    } catch (error) {
      setError(`Chain ${chain?.id} not supported. Coming soon!`);
    }
    setLoading(false);
  }, [address, chain?.id, setTokens]);

  useEffect(() => {
    if (address && chain?.id) {
      fetchData();
      setCheckedRecords({});
    }
  }, [address, chain?.id]);

  useEffect(() => {
    if (!isConnected) {
      setTokens([]);
      setCheckedRecords({});
    }
  }, [isConnected, setTokens, setCheckedRecords]);

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.contract_ticker_symbol
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      token.contract_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZeroBalance = hideZeroBalance
      ? parseFloat(token.balance) > 0
      : true;
    const matchesStables = stablesOnly ? token.type === 'stablecoin' : true;
    return matchesSearch && matchesZeroBalance && matchesStables;
  });

  const checkedCount = Object.values(checkedRecords).filter(
    (record) => record.isChecked,
  ).length;

  const selectAll = () => {
    const newRecords: any = {};
    filteredTokens.forEach((token) => {
      newRecords[token.contract_address] = { isChecked: true };
    });
    setCheckedRecords((old) => ({ ...old, ...newRecords }));
  };

  const unselectAll = () => {
    setCheckedRecords({});
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white/50">Connect your wallet to view tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Stats */}
      <PortfolioStats />

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="glass-card p-4">
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setHideZeroBalance(!hideZeroBalance)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${
                hideZeroBalance
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
              }
            `}
          >
            Hide Zero Balance
          </button>
          <button
            onClick={() => setStablesOnly(!stablesOnly)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${
                stablesOnly
                  ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
              }
            `}
          >
            Stables Only
          </button>
          {checkedCount > 0 && (
            <>
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
              >
                Select All
              </button>
              <button
                onClick={unselectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
              >
                Unselect All
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Token List */}
      {!loading && !error && (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTokens.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <p className="text-white/50">
                  {tokens.length === 0
                    ? `No tokens found on ${chain?.name}`
                    : 'No tokens match your filters'}
                </p>
              </motion.div>
            ) : (
              filteredTokens.map((token) => (
                <TokenRow key={token.contract_address} token={token} />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
