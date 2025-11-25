'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWalletPersistence } from '../../hooks/useWalletPersistence';
import { useTerraTempoContract } from '../../hooks/useTerraTempoContract';
import { ROUTES } from '../../lib/constants';

export default function RecordsPage() {
  const { isConnected, provider, chainId, isReconnecting } = useWalletPersistence();
  const [recordIds, setRecordIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { getMyRecordIds } = useTerraTempoContract(provider, chainId);

  useEffect(() => {
    if (!isConnected || !provider || !chainId) return;

    const loadRecords = async () => {
      try {
        setIsLoading(true);
        const ids = await getMyRecordIds();
        setRecordIds(ids);
      } catch (error) {
        console.error('Failed to load records:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecords();
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
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view your records
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Crop Records
        </h1>
        <Link
          href={ROUTES.RECORDS_NEW}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
        >
          + New Record
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading records...
        </div>
      ) : recordIds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven&apos;t submitted any crop records yet
          </p>
          <Link
            href={ROUTES.RECORDS_NEW}
            className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
          >
            Submit Your First Record
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordIds.map((id) => (
            <div key={id.toString()} className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
              <div className="text-4xl mb-3">🌾</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Record #{id.toString()}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Encrypted crop data on-chain
              </p>
              <Link
                href={ROUTES.RECORDS_DETAIL(id.toString())}
                className="inline-block px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


