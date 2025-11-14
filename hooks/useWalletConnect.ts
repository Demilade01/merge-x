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
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { Web3Wallet } from '@walletconnect/web3wallet';

// Use InstanceType to get the instance type from the class
type EthereumProviderInstance = InstanceType<typeof EthereumProvider>;
type Web3WalletInstance = InstanceType<typeof Web3Wallet>;

interface UseWalletConnectReturn {
  ethereumProvider: EthereumProviderInstance | null;
  web3Wallet: Web3WalletInstance | null;
  isInitializing: boolean;
  isConnected: boolean;
  address: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  utils: typeof walletConnectUtils;
}

export const useWalletConnect = (): UseWalletConnectReturn => {
  const [ethereumProvider, setEthereumProvider] =
    useState<EthereumProviderInstance | null>(null);
  const [web3Wallet, setWeb3Wallet] = useState<Web3WalletInstance | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track connected address from provider
  useEffect(() => {
    if (!ethereumProvider) {
      setAddress(null);
      return;
    }

    const updateAddress = async () => {
      try {
        const accounts = ethereumProvider.accounts;
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          setAddress(null);
        }
      } catch (err) {
        setAddress(null);
      }
    };

    updateAddress();

    // Listen for account changes
    ethereumProvider.on('accountsChanged', updateAddress);
    ethereumProvider.on('disconnect', () => {
      setAddress(null);
      setEthereumProvider(null);
    });

    return () => {
      ethereumProvider.removeListener('accountsChanged', updateAddress);
      ethereumProvider.removeListener('disconnect', () => {
        setAddress(null);
        setEthereumProvider(null);
      });
    };
  }, [ethereumProvider]);

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
      setIsInitializing(true);

      const provider = await initEthereumProvider();

      if (provider) {
        await provider.enable();
        setEthereumProvider(provider);
        const accounts = provider.accounts;
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } else {
        const errorMsg =
          'WebSocket connection to WalletConnect relay servers failed. This is usually a network/firewall issue. Try: different network, disable VPN, or check firewall settings. Note: RainbowKit WalletConnect should still work.';
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect';
      setError(errorMessage);
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (ethereumProvider) {
        await ethereumProvider.disconnect();
        setEthereumProvider(null);
        setAddress(null);
      }
      if (web3Wallet) {
        // Get active pairings and disconnect them
        const pairings = web3Wallet.core.pairing.getPairings();
        for (const pairing of pairings) {
          await web3Wallet.core.pairing.disconnect({ topic: pairing.topic });
        }
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
    isConnected: !!address && !!ethereumProvider,
    address,
    error,
    connect,
    disconnect,
    utils: walletConnectUtils,
  };
};
