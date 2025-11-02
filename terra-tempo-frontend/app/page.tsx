'use client';

import Link from 'next/link';
import { useWalletPersistence } from '../hooks/useWalletPersistence';
import { ROUTES } from '../lib/constants';

export default function HomePage() {
  const { isConnected } = useWalletPersistence();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Terra Tempo
        </h1>
        <p className="text-2xl text-primary dark:text-primary-dark mb-8">
          Cultivate Knowledge, Protect Privacy
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          A decentralized agricultural community platform that enables farmers to securely submit encrypted crop records 
          while maintaining full privacy. Get personalized recommendations and expert guidance without compromising your data.
        </p>
        
        {isConnected ? (
          <Link 
            href={ROUTES.DASHBOARD}
            className="inline-block px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg text-lg font-semibold transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">
            <p className="mb-4">Connect your wallet to get started</p>
            <div className="text-sm">
              Use the &quot;Connect Wallet&quot; button in the navigation bar
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Privacy-First
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All crop records are encrypted on-chain using FHEVM technology
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Encrypted Analysis
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Get insights and recommendations without revealing your data
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-4">👨‍🌾</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Expert Guidance
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Experts provide advice based on aggregated trends, not individual records
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-4">🌱</div>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Community-Driven
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Share knowledge and learn from anonymized community insights
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Use MetaMask or any EIP-6963 compatible wallet to connect securely
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Submit Encrypted Records</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your crop data - everything is encrypted before leaving your browser
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Get Personalized Insights</h4>
              <p className="text-gray-600 dark:text-gray-400">
                View analytics, predictions, and recommendations - only you can decrypt your data
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">Learn from the Community</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Access aggregated best practices and expert guidance from the knowledge base
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 py-8 mt-12">
        <div className="flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
          <Link href={ROUTES.KNOWLEDGE} className="hover:text-primary transition">
            Knowledge Base
          </Link>
          <a href="https://docs.zama.ai/fhevm" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
            FHEVM Docs
          </a>
          <a href="https://github.com/zama-ai" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
            GitHub
          </a>
        </div>
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-500">
          © 2025 Terra Tempo. Built with FHEVM by Zama.
        </div>
      </div>
    </div>
  );
}


