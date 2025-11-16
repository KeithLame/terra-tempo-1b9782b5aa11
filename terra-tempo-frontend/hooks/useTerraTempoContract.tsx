'use client';

import { useState, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { TerraTempoCoreABI } from '../abi/TerraTempoCoreABI';
import { getTerraTempoCoreAddress } from '../abi/TerraTempoCoreAddresses';

export function useTerraTempoContract(provider: BrowserProvider | null, chainId: number | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!provider || !chainId) {
      throw new Error('Provider or chain not connected');
    }

    // Determine network based on chain ID
    const network = chainId === 31337 ? 'localhost' : 'sepolia';
    const address = getTerraTempoCoreAddress(network);

    if (!address) {
      throw new Error(`Contract not deployed on ${network}`);
    }

    const signer = await provider.getSigner();
    return new Contract(address, TerraTempoCoreABI, signer);
  }, [provider, chainId]);

  const submitRecord = useCallback(async (encryptedData: any[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const contract = await getContract();
      const tx = await contract.submitCropRecord(...encryptedData);
      const receipt = await tx.wait();

      return receipt;
    } catch (err: any) {
      console.error('Submit record failed:', err);
      setError(err.message || 'Transaction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getMyRecordIds = useCallback(async (): Promise<bigint[]> => {
    try {
      const contract = await getContract();
      return await contract.getMyRecordIds();
    } catch (err: any) {
      console.error('Get records failed:', err);
      throw err;
    }
  }, [getContract]);

  const getRecordData = useCallback(async (recordId: bigint) => {
    try {
      const contract = await getContract();
      // getRecordData is now a non-view function (to set ACL permissions)
      // For non-view functions that return values in ethers.js v6,
      // we need to use staticCall to simulate the call and get the result
      // However, staticCall won't actually set ACL permissions on-chain
      // So we need to send a transaction first to set ACL, then use staticCall to get data
      
      // Step 1: Send transaction to set ACL permissions (this will set ACL but we don't need the result)
      try {
        const tx = await contract.getRecordData(recordId);
        await tx.wait();
        console.log('✓ ACL permissions set via transaction');
      } catch (aclError: any) {
        // If transaction fails, try staticCall anyway
        console.warn('Failed to set ACL via transaction, using staticCall:', aclError.message);
      }
      
      // Step 2: Use staticCall to get the actual data (this simulates the call without sending a transaction)
      // Note: This might not have ACL set, but it will give us the handles
      const result = await contract.getRecordData.staticCall(recordId);
      return result;
    } catch (err: any) {
      console.error('Get record data failed:', err);
      throw err;
    }
  }, [getContract]);

  const getPersonalStats = useCallback(async () => {
    try {
      const contract = await getContract();
      return await contract.getPersonalStats();
    } catch (err: any) {
      console.error('Get personal stats failed:', err);
      throw err;
    }
  }, [getContract]);

  return {
    isLoading,
    error,
    submitRecord,
    getMyRecordIds,
    getRecordData,
    getPersonalStats,
  };
}

