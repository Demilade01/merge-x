import { motion } from 'framer-motion';
import { WalletPanel } from '../components/WalletPanel';
import { TokenList } from '../components/TokenList';
import { TransferPanel } from '../components/TransferPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 backdrop-blur-xl bg-zinc-900/80 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Merge-X
            </h1>
            <p className="text-sm text-white/50">Batch token transfers</p>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Two Panel Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Wallet & Chain Selector */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <WalletPanel />
          </motion.div>

          {/* Right Panel - Token List & Transfer */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <TokenList />
            <TransferPanel />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
