/**
 * WalletConnect utilities to be used alongside RainbowKit
 * These provide additional WalletConnect features beyond what RainbowKit offers
 */

import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { Core } from '@walletconnect/core';

// Get WalletConnect Project ID from environment
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

/**
 * Initialize WalletConnect Ethereum Provider
 * This can be used for direct WalletConnect connections
 */
export const initEthereumProvider = async () => {
  try {
    const provider = await EthereumProvider.init({
      projectId: walletConnectProjectId,
      chains: [1], // Ethereum mainnet by default
      showQrModal: true,
      metadata: {
        name: 'Merge-X',
        description:
          'Batch-transfer selected ERC-20 tokens from one EVM wallet to another',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [],
      },
    });

    return provider;
  } catch (error) {
    console.error('Failed to initialize Ethereum Provider:', error);
    return null;
  }
};

/**
 * Initialize WalletConnect Core
 * Core functionality for WalletConnect protocol
 */
export const initWalletConnectCore = () => {
  try {
    const core = new Core({
      projectId: walletConnectProjectId,
    });

    return core;
  } catch (error) {
    console.error('Failed to initialize WalletConnect Core:', error);
    return null;
  }
};

/**
 * Initialize Web3Wallet
 * For wallet-to-wallet communication features
 */
export const initWeb3Wallet = async () => {
  try {
    const core = initWalletConnectCore();
    if (!core) return null;

    // Use type assertion to handle version mismatch between packages
    const web3wallet = await Web3Wallet.init({
      core: core as any,
      metadata: {
        name: 'Merge-X',
        description:
          'Batch-transfer selected ERC-20 tokens from one EVM wallet to another',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [],
      },
    });

    return web3wallet;
  } catch (error) {
    console.error('Failed to initialize Web3Wallet:', error);
    return null;
  }
};

/**
 * WalletConnect utility functions
 */
export const walletConnectUtils = {
  /**
   * Format address for display
   */
  formatAddress: (address: string, chars = 4): string => {
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  },

  /**
   * Validate Ethereum address
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  /**
   * Get chain name from chain ID
   */
  getChainName: (chainId: number): string => {
    const chainMap: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      10: 'Optimism',
      42161: 'Arbitrum',
      56: 'BSC',
      100: 'Gnosis',
      8453: 'Base',
      43114: 'Avalanche',
      250: 'Fantom',
    };
    return chainMap[chainId] || `Chain ${chainId}`;
  },
};

// Note: @walletconnect/utils doesn't export a Utils class
// Use the walletConnectUtils object above for utility functions
