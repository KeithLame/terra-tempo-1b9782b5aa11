'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWalletPersistence } from '../../hooks/useWalletPersistence';
import { useTerraTempoContract } from '../../hooks/useTerraTempoContract';
import { ROUTES } from '../../lib/constants';

export default function DashboardPage() {
  const { isConnected, address, provider, chainId, isReconnecting } = useWalletPersistence();
  const [recordCount, setRecordCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getMyRecordIds, getPersonalStats } = useTerraTempoContract(provider, chainId);

  useEffect(() => {
    if (!isConnected || !provider || !chainId) return;

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const recordIds = await getMyRecordIds();
        setRecordCount(recordIds.length);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isConnected, provider, chainId, getMyRecordIds]);

  if (isReconnecting || (isConnected && !provider)) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl mb-4">⏳</div>
        <p className="text-gray-600 dark:text-gray-400">Reconnecting wallet...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Please connect your wallet to access the dashboard
        </p>
        <Link 
          href={ROUTES.HOME}
          className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Dashboard
      </h1>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Records
          </h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '...' : recordCount}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-2">🌱</div>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Active Crops
          </h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLoading ? '...' : recordCount}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Yield Score
          </h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            --
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-card">
          <div className="text-4xl mb-2">💡</div>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Recommendations
          </h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            0
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={ROUTES.RECORDS_NEW}
            className="p-6 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-card transition text-center"
          >
            <div className="text-3xl mb-2">➕</div>
            <div className="font-semibold">Submit New Record</div>
          </Link>

          <Link
            href={ROUTES.ANALYTICS}
            className="p-6 bg-secondary hover:bg-secondary/90 text-black rounded-lg shadow-card transition text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold">View Analytics</div>
          </Link>

          <Link
            href={ROUTES.KNOWLEDGE}
            className="p-6 bg-accent hover:bg-accent/90 text-black rounded-lg shadow-card transition text-center"
          >
            <div className="text-3xl mb-2">📚</div>
            <div className="font-semibold">Knowledge Base</div>
          </Link>

          <Link
            href={ROUTES.RECORDS}
            className="p-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg shadow-card transition text-center"
          >
            <div className="text-3xl mb-2">📁</div>
            <div className="font-semibold">My Records</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
          {recordCount === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="mb-4">No records yet</p>
              <Link
                href={ROUTES.RECORDS_NEW}
                className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
              >
                Submit Your First Record
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {recordCount} crop record{recordCount !== 1 ? 's' : ''} submitted
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    All data encrypted and secure
                  </div>
                </div>
                <Link
                  href={ROUTES.RECORDS}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                >
                  View All
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


