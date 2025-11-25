'use client';

import { useEffect, useState } from 'react';
import { useWalletPersistence } from '../../hooks/useWalletPersistence';
import { useTerraTempoContract } from '../../hooks/useTerraTempoContract';
import { CROP_TYPES } from '../../lib/constants';

function getCropTypeName(value: number): string {
  const crop = CROP_TYPES.find(c => c.value === value);
  return crop ? crop.label : `Unknown (${value})`;
}

export default function AnalyticsPage() {
  const { isConnected, address, provider, chainId, isReconnecting } = useWalletPersistence();
  const { getPersonalStats, getMyRecordIds } = useTerraTempoContract(provider, chainId);
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    if (isReconnecting || (isConnected && !provider)) {
      return;
    }

    if (!isConnected || !provider || !chainId) {
      setIsLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        setIsLoading(true);
        
        // Get record count
        const recordIds = await getMyRecordIds();
        setRecordCount(recordIds.length);
        
        // Get personal stats (encrypted, would need decryption in production)
        // For now, just show record count
        setStats({
          totalRecords: recordIds.length,
          averageYield: 0, // Would need to decrypt and calculate
          totalLandArea: 0, // Would need to decrypt and calculate
        });
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [isConnected, isReconnecting, provider, chainId, getPersonalStats, getMyRecordIds]);

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
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view analytics
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Personal Analytics
      </h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Records
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {recordCount}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
              <div className="text-3xl mb-2">🌾</div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Average Yield
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.averageYield > 0 ? `${stats.averageYield.toLocaleString()} kg` : 'N/A'}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Land Area
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalLandArea > 0 ? `${stats.totalLandArea.toFixed(2)} ha` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Analytics Sections */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Yield Trends
            </h2>
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              {recordCount === 0 ? (
                <div>
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg mb-2">No data available yet</p>
                  <p className="text-sm">Submit your first crop record to see analytics</p>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-lg mb-2">Chart visualization coming soon</p>
                  <p className="text-sm">Your encrypted data will be analyzed and displayed here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              AI-Generated Recommendations
            </h2>
            {recordCount === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <div className="text-4xl mb-4">💡</div>
                <p>Submit records to receive personalized recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    💡 Keep Submitting Records
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Continue submitting crop records to build a comprehensive dataset for better analytics and recommendations.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="font-semibold text-green-900 dark:text-green-300 mb-2">
                    📊 Data Privacy Protected
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    All your data is encrypted on-chain. Only you can decrypt and view your personal analytics.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


