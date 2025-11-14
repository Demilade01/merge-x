/**
 * React hook for WalletConnect utilities
 * Use this alongside RainbowKit for additional WalletConnect features
 */

import { useState, useEffect, useCallback } from 'react';
import {
  initEthereumProvider,
  initWeb3Wallet,
  walletConnectUtils,
} from '../src/utils/walletconnect';
import type { EthereumProvider } from '@walletconnect/ethereum-provider';
import type { Web3Wallet } from '@walletconnect/web3wallet';

interface UseWalletConnectReturn {
  ethereumProvider: EthereumProvider | null;
  web3Wallet: Web3Wallet | null;
  isInitializing: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  utils: typeof walletConnectUtils;
}

export const useWalletConnect = (): UseWalletConnectReturn => {
  const [ethereumProvider, setEthereumProvider] =
    useState<EthereumProvider | null>(null);
  const [web3Wallet, setWeb3Wallet] = useState<Web3Wallet | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize providers
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // Initialize Ethereum Provider (optional - only if needed)
        // const provider = await initEthereumProvider();
        // setEthereumProvider(provider);
        // Initialize Web3Wallet (optional - only if needed)
        // const wallet = await initWeb3Wallet();
        // setWeb3Wallet(wallet);
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize WalletConnect');
      } finally {
        setIsInitializing(false);
      }
    };

    // Only initialize on client side
    if (typeof window !== 'undefined') {
      // Uncomment if you want to auto-initialize
      // initialize();
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const provider = await initEthereumProvider();
      if (provider) {
        await provider.enable();
        setEthereumProvider(provider);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect');
      throw err;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (ethereumProvider) {
        await ethereumProvider.disconnect();
        setEthereumProvider(null);
      }
      if (web3Wallet) {
        await web3Wallet.core.pairing.disconnect();
        setWeb3Wallet(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to disconnect');
    }
  }, [ethereumProvider, web3Wallet]);

  return {
    ethereumProvider,
    web3Wallet,
    isInitializing,
    error,
    connect,
    disconnect,
    utils: walletConnectUtils,
  };
};
