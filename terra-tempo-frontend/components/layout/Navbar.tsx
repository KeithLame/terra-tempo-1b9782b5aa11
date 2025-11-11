'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useWalletPersistence } from '../../hooks/useWalletPersistence';
import { useEip6963 } from '../../hooks/metamask/useEip6963';
import { truncateAddress } from '../../lib/utils';
import { ROUTES } from '../../lib/constants';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isConnected, address, connectWallet, disconnectWallet, isReconnecting } = useWalletPersistence();
  const { providers } = useEip6963();

  const handleConnect = async (rdns: string) => {
    try {
      await connectWallet(rdns);
      setShowWalletModal(false);
    } catch (error) {
      // Handle wallet connection errors gracefully
      console.error('Connection failed:', error);
    }
  };

  return (
    <nav className="bg-primary dark:bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold">Terra Tempo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href={ROUTES.HOME} className="hover:text-secondary transition">
              Home
            </Link>
            {isConnected && (
              <>
                <Link href={ROUTES.DASHBOARD} className="hover:text-secondary transition">
                  Dashboard
                </Link>
                <Link href={ROUTES.RECORDS} className="hover:text-secondary transition">
                  My Records
                </Link>
                <Link href={ROUTES.ANALYTICS} className="hover:text-secondary transition">
                  Analytics
                </Link>
              </>
            )}
            <Link href={ROUTES.KNOWLEDGE} className="hover:text-secondary transition">
              Knowledge Base
            </Link>
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-4">
            {isReconnecting ? (
              <div className="text-sm">Reconnecting...</div>
            ) : isConnected && address ? (
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-white/10 rounded-lg font-mono text-sm">
                  {truncateAddress(address)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-danger hover:bg-danger/90 rounded-lg transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-black rounded-lg transition"
              >
                Connect Wallet
              </button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href={ROUTES.HOME} className="block py-2 hover:text-secondary transition">
              Home
            </Link>
            {isConnected && (
              <>
                <Link href={ROUTES.DASHBOARD} className="block py-2 hover:text-secondary transition">
                  Dashboard
                </Link>
                <Link href={ROUTES.RECORDS} className="block py-2 hover:text-secondary transition">
                  My Records
                </Link>
                <Link href={ROUTES.ANALYTICS} className="block py-2 hover:text-secondary transition">
                  Analytics
                </Link>
              </>
            )}
            <Link href={ROUTES.KNOWLEDGE} className="block py-2 hover:text-secondary transition">
              Knowledge Base
            </Link>
          </div>
        )}
      </div>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWalletModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Connect Wallet</h2>
            <div className="space-y-3">
              {providers.length > 0 ? (
                providers.map((provider) => (
                  <button
                    key={provider.info.uuid}
                    onClick={() => handleConnect(provider.info.rdns)}
                    className="w-full flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {provider.info.icon && (
                      <img src={provider.info.icon} alt={provider.info.name} className="w-8 h-8" />
                    )}
                    <span className="text-gray-900 dark:text-white">{provider.info.name}</span>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                  No wallets detected. Please install MetaMask or another Web3 wallet.
                </div>
              )}
            </div>
            <button
              onClick={() => setShowWalletModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}


