'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWalletPersistence } from '../../../hooks/useWalletPersistence';
import { useTerraTempoContract } from '../../../hooks/useTerraTempoContract';
import { useFhevm } from '../../../fhevm/useFhevm';
import { CROP_TYPES } from '../../../lib/constants';

function getCropTypeName(value: number): string {
  const crop = CROP_TYPES.find(c => c.value === value);
  return crop ? crop.label : `Unknown (${value})`;
}

function RecordDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('id');
  
  const { isConnected, address, provider, chainId, isReconnecting } = useWalletPersistence();
  const { getRecordData } = useTerraTempoContract(provider, chainId);
  const { userDecrypt, instance } = useFhevm();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [recordData, setRecordData] = useState<any>(null);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for wallet to be ready (not reconnecting and provider available)
    if (isReconnecting || (isConnected && !provider)) {
      return;
    }

    if (!isConnected || !recordId || !provider || !chainId) {
      setIsLoading(false);
      return;
    }

    const loadRecord = async () => {
      try {
        setIsLoading(true);
        const data = await getRecordData(BigInt(recordId));
        
        // Contract returns a Result object (tuple), convert to array
        // Result structure: [cropType, landArea, actualYield, submittedAt]
        // ethers.js Result objects can be accessed by index or property name
        let recordArray;
        if (Array.isArray(data)) {
          recordArray = data;
        } else if (data && typeof data === 'object') {
          // Try property names first, then indices
          recordArray = [
            data.cropType ?? data[0] ?? data['0'],
            data.landArea ?? data[1] ?? data['1'],
            data.actualYield ?? data[2] ?? data['2'],
            data.submittedAt ?? data[3] ?? data['3'],
          ];
        } else {
          throw new Error('Invalid record data format');
        }
        
        setRecordData(recordArray);
        
        console.log('Record data loaded (encrypted):', {
          raw: data,
          array: recordArray,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : [],
          values: recordArray,
          rawType: typeof data,
          rawConstructor: data?.constructor?.name,
          rawLength: data?.length,
          raw0: data?.[0],
          raw1: data?.[1],
          raw2: data?.[2],
          raw3: data?.[3],
        });
        
      } catch (error) {
        console.error('Failed to load record:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecord();
  }, [isConnected, isReconnecting, provider, chainId, recordId, getRecordData]);

  const handleDecrypt = async () => {
    if (!recordData || !address || !instance || !chainId) {
      setDecryptError('Missing required data for decryption');
      return;
    }

    try {
      setIsDecrypting(true);
      setDecryptError(null);

      // Get contract address
      const network = chainId === 31337 ? 'localhost' : 'sepolia';
      const contractAddress = await import('../../../abi/TerraTempoCoreAddresses').then(
        mod => mod.getTerraTempoCoreAddress(network)
      );

      if (!contractAddress) {
        throw new Error('Contract address not found');
      }

      console.log('🔓 Starting decryption...');
      console.log('Contract:', contractAddress);
      console.log('User:', address);

      // Decrypt each encrypted field
      // recordData structure: [cropType, landArea, actualYield, submittedAt]
      // Ensure recordData is an array
      console.log('Processing recordData for decryption:', {
        recordData,
        isArray: Array.isArray(recordData),
        type: typeof recordData,
        keys: recordData ? Object.keys(recordData) : [],
        length: recordData?.length,
        has0: recordData?.[0] !== undefined,
        has1: recordData?.[1] !== undefined,
        has2: recordData?.[2] !== undefined,
        has3: recordData?.[3] !== undefined,
      });
      
      let recordArray;
      if (Array.isArray(recordData)) {
        recordArray = recordData;
      } else if (recordData && typeof recordData === 'object') {
        // Try multiple ways to access the data
        // ethers.js Result objects can be accessed by index
        const tryGet = (index: number) => {
          if (recordData[index] !== undefined) return recordData[index];
          if (recordData[String(index)] !== undefined) return recordData[String(index)];
          // Try property names
          const propNames = ['cropType', 'landArea', 'actualYield', 'submittedAt'];
          if (recordData[propNames[index]] !== undefined) return recordData[propNames[index]];
          return undefined;
        };
        
        recordArray = [
          tryGet(0),
          tryGet(1),
          tryGet(2),
          tryGet(3),
        ];
      } else {
        throw new Error('Invalid record data format');
      }
      
      console.log('Extracted recordArray:', {
        recordArray,
        length: recordArray.length,
        allDefined: recordArray.every(v => v !== undefined && v !== null),
      });
      
      if (recordArray.length < 4) {
        throw new Error(`Invalid record array length: ${recordArray.length}, expected 4`);
      }
      
      const [cropTypeHandle, landAreaHandle, actualYieldHandle, submittedAt] = recordArray;

      console.log('Handle types:', {
        cropType: typeof cropTypeHandle,
        landArea: typeof landAreaHandle,
        actualYield: typeof actualYieldHandle,
        submittedAt: typeof submittedAt,
      });
      console.log('Handle values:', { 
        cropTypeHandle, 
        landAreaHandle, 
        actualYieldHandle,
        submittedAt,
        recordArrayLength: recordArray.length,
      });
      
      // Validate handles before formatting
      if (!cropTypeHandle) throw new Error('cropTypeHandle is undefined or null');
      if (!landAreaHandle) throw new Error('landAreaHandle is undefined or null');
      if (!actualYieldHandle) throw new Error('actualYieldHandle is undefined or null');

      // Convert handles to string format (0x...)
      const formatHandle = (handle: any): string => {
        if (!handle) {
          throw new Error('Handle is undefined or null');
        }
        if (typeof handle === 'string') {
          return handle.startsWith('0x') ? handle : '0x' + handle;
        }
        if (typeof handle === 'bigint') {
          return '0x' + handle.toString(16).padStart(64, '0');
        }
        // If it's an object with _hex or similar
        if (handle && typeof handle === 'object') {
          if (handle._hex) return handle._hex;
          if (handle.toHexString) return handle.toHexString();
          // Try accessing as Result object
          if (handle.toString && typeof handle.toString === 'function') {
            const str = handle.toString();
            if (str.startsWith('0x')) return str;
          }
        }
        // Last resort: convert to string
        const str = String(handle);
        return str.startsWith('0x') ? str : '0x' + str;
      };

      const cropTypeHandleStr = formatHandle(cropTypeHandle);
      const landAreaHandleStr = formatHandle(landAreaHandle);
      const actualYieldHandleStr = formatHandle(actualYieldHandle);

      console.log('Formatted handles:', {
        cropType: cropTypeHandleStr,
        landArea: landAreaHandleStr,
        actualYield: actualYieldHandleStr,
      });

      console.log('Decrypting 3 fields...');
      const decryptedValues = await userDecrypt(
        contractAddress,
        [cropTypeHandleStr, landAreaHandleStr, actualYieldHandleStr],
        address
      );

      const decryptedCropType = decryptedValues[0];
      const decryptedLandArea = decryptedValues[1];
      const decryptedActualYield = decryptedValues[2];

      const decrypted = {
        cropType: Number(decryptedCropType),
        landArea: Number(decryptedLandArea) / 100, // Unscale (was multiplied by 100)
        actualYield: Number(decryptedActualYield),
        submittedAt: Number(submittedAt),
      };

      console.log('✓ Decryption successful:', decrypted);
      setDecryptedData(decrypted);
    } catch (error: any) {
      console.error('Decryption failed:', error);
      setDecryptError(error.message || 'Failed to decrypt data');
    } finally {
      setIsDecrypting(false);
    }
  };

  if (!recordId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Invalid Record
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No record ID provided
        </p>
        <button
          onClick={() => router.push('/records')}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
        >
          View All Records
        </button>
      </div>
    );
  }

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
          Please connect your wallet to view record details
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Record #{recordId}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Encrypted crop record details
      </p>

      {isLoading ? (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          Loading record...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Record Information
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {decryptedData ? 'Decrypted' : 'Encrypted & Stored On-Chain'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Submitted At</div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {recordData?.[3] ? new Date(Number(recordData[3]) * 1000).toLocaleString() : 'N/A'}
                </div>
              </div>
              
              {!decryptedData && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    🔐 Your data is encrypted on-chain. To view decrypted details, click the button below.
                  </p>
                  {decryptError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm">
                      {decryptError}
                    </div>
                  )}
                  <button
                    className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white rounded-lg transition"
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
                  >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt & View Details'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {decryptedData && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Decrypted Data
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Crop Type</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {getCropTypeName(decryptedData.cropType)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Land Area</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {decryptedData.landArea.toFixed(2)} hectares
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actual Yield</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {decryptedData.actualYield.toLocaleString()} kg
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Yield per Hectare</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(decryptedData.actualYield / decryptedData.landArea).toFixed(2)} kg/ha
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg text-sm">
                ✓ Data successfully decrypted and displayed securely
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecordDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RecordDetailContent />
    </Suspense>
  );
}

