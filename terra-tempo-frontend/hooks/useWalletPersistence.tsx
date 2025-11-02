'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider } from 'ethers';
import { useEip6963 } from './metamask/useEip6963';
import { STORAGE_KEYS } from '../lib/constants';
import { storage } from '../lib/utils';
import { useFhevm } from '../fhevm/useFhevm';

// Global flag to prevent duplicate silent reconnect attempts (survives React re-renders)
let globalReconnectAttempted = false;

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
}

export function useWalletPersistence() {
  // CRITICAL: Always start with false on both server and client to avoid hydration mismatch
  // We'll update from localStorage in useEffect (client-side only)
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    provider: null,
  });
  
  // CRITICAL: Always start with false to avoid hydration mismatch
  // Will be set to true in useEffect only if we have a stored connection (client-side only)
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const hasAttemptedReconnect = useRef(false);

  const { providers, getProviderByRdns } = useEip6963();
  const { initialize: initializeFhevm } = useFhevm();

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    clearWalletState();
    setWalletState({
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
    });
    console.log('✓ Wallet disconnected');
  }, []);

  // Setup event listeners
  const setupEventListeners = useCallback((provider: any) => {
    // Remove existing listeners to prevent duplicates
    provider.removeAllListeners?.('accountsChanged');
    provider.removeAllListeners?.('chainChanged');
    provider.removeAllListeners?.('disconnect');

    provider.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        storage.set(STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(accounts));
        setWalletState(prev => ({ ...prev, address: accounts[0] }));
      }
    });

    provider.on('chainChanged', (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      console.log('Chain changed:', chainId);
      storage.set(STORAGE_KEYS.WALLET_CHAIN_ID, chainId.toString());
      
      // Reload page for chain change (common practice)
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    });

    provider.on('disconnect', () => {
      console.log('Provider disconnected');
      disconnectWallet();
    });
  }, [disconnectWallet]);

  // Load initial state from localStorage (only once on mount)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsReconnecting(false);
      return;
    }

    const wasConnected = storage.get(STORAGE_KEYS.WALLET_CONNECTED) === 'true';
    const lastAccounts = storage.get(STORAGE_KEYS.WALLET_ACCOUNTS);
    const lastChainId = storage.get(STORAGE_KEYS.WALLET_CHAIN_ID);

    if (wasConnected && lastAccounts) {
      try {
        const accounts = JSON.parse(lastAccounts);
        setWalletState({
          isConnected: true,
          address: accounts[0] || null,
          chainId: lastChainId ? parseInt(lastChainId, 10) : null,
          provider: null,
        });
        setIsReconnecting(true);
      } catch (e) {
        console.error('Failed to parse stored accounts:', e);
        setIsReconnecting(false);
        hasAttemptedReconnect.current = true;
      }
    } else {
      setIsReconnecting(false);
      hasAttemptedReconnect.current = true;
    }
  }, []); // Only run once on mount

  // Handle reconnection (when providers are ready)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // If already connected with provider, done
    if (walletState.isConnected && walletState.provider) {
      setIsReconnecting(false);
      return;
    }

    // If global reconnect already attempted, quick restore
    if (globalReconnectAttempted) {
      const lastConnectorId = storage.get(STORAGE_KEYS.WALLET_CONNECTOR_ID);
      const lastAccounts = storage.get(STORAGE_KEYS.WALLET_ACCOUNTS);
      const lastChainId = storage.get(STORAGE_KEYS.WALLET_CHAIN_ID);
      
      if (lastConnectorId && lastAccounts) {
        const providerDetail = getProviderByRdns(lastConnectorId);
        if (providerDetail) {
          try {
            const provider = new BrowserProvider(providerDetail.provider);
            const accounts = JSON.parse(lastAccounts);
            
            setWalletState({
              isConnected: true,
              address: accounts[0] || null,
              chainId: lastChainId ? parseInt(lastChainId, 10) : null,
              provider,
            });
            setIsReconnecting(false);
            setupEventListeners(providerDetail.provider);
            return;
          } catch (e) {
            console.warn('Quick restore failed:', e);
          }
        }
      }
      setIsReconnecting(false);
      return;
    }

    // If wallet not connected, done
    if (!walletState.isConnected) {
      setIsReconnecting(false);
      return;
    }

    // If already attempted, done
    if (hasAttemptedReconnect.current) {
      setIsReconnecting(false);
      return;
    }

    // Need to reconnect: wait for providers
    if (providers.length === 0) {
      const timeoutId = setTimeout(() => {
        setIsReconnecting(false);
        hasAttemptedReconnect.current = true;
      }, 3000);
      return () => clearTimeout(timeoutId);
    }

    // Mark as attempted
    hasAttemptedReconnect.current = true;
    globalReconnectAttempted = true;

    const lastConnectorId = storage.get(STORAGE_KEYS.WALLET_CONNECTOR_ID);
    if (!lastConnectorId) {
      setIsReconnecting(false);
      return;
    }

    const attemptSilentReconnect = async () => {
      const providerDetail = getProviderByRdns(lastConnectorId);
      if (!providerDetail) {
        clearWalletState();
        setIsReconnecting(false);
        return;
      }

      try {
        const provider = new BrowserProvider(providerDetail.provider);
        const accounts = await providerDetail.provider.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId,
            provider,
          });
          setIsReconnecting(false);

          await initializeFhevm(provider, chainId, providerDetail.provider);
          setupEventListeners(providerDetail.provider);
        } else {
          clearWalletState();
          setIsReconnecting(false);
        }
      } catch (error) {
        console.error('Silent reconnect failed:', error);
        clearWalletState();
        setIsReconnecting(false);
      }
    };

    attemptSilentReconnect();
  }, [providers.length, walletState.isConnected, walletState.provider, getProviderByRdns, initializeFhevm, setupEventListeners]);

  // Connect wallet (user action)
  const connectWallet = useCallback(async (rdns: string) => {
    const providerDetail = getProviderByRdns(rdns);
    if (!providerDetail) {
      throw new Error('Provider not found');
    }

    try {
      const provider = new BrowserProvider(providerDetail.provider);
      
      // Request accounts (user approval required)
      const accounts = await providerDetail.provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Store connection state
      storage.set(STORAGE_KEYS.WALLET_CONNECTED, 'true');
      storage.set(STORAGE_KEYS.WALLET_CONNECTOR_ID, rdns);
      storage.set(STORAGE_KEYS.WALLET_ACCOUNTS, JSON.stringify(accounts));
      storage.set(STORAGE_KEYS.WALLET_CHAIN_ID, chainId.toString());

      setWalletState({
        isConnected: true,
        address: accounts[0],
        chainId,
        provider,
      });

      console.log('✓ Wallet connected:', accounts[0]);
      
      // Initialize FHEVM after wallet connection is established
      // Pass both BrowserProvider and the raw EIP-1193 provider
      await initializeFhevm(provider, chainId, providerDetail.provider);

      // Setup event listeners
      setupEventListeners(providerDetail.provider);
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [getProviderByRdns, initializeFhevm, setupEventListeners]);

  return {
    ...walletState,
    isReconnecting,
    connectWallet,
    disconnectWallet,
  };
}

function clearWalletState() {
  storage.remove(STORAGE_KEYS.WALLET_CONNECTED);
  storage.remove(STORAGE_KEYS.WALLET_CONNECTOR_ID);
  storage.remove(STORAGE_KEYS.WALLET_ACCOUNTS);
  storage.remove(STORAGE_KEYS.WALLET_CHAIN_ID);
}

