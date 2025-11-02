'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { createFhevmInstance, FhevmInstance } from './internal/fhevm';

interface FhevmContextType {
  instance: FhevmInstance | null;
  isInitializing: boolean;
  error: string | null;
  initialize: (provider: BrowserProvider, chainId: number, eip1193Provider?: any) => Promise<void>;
  userDecrypt: (contractAddress: string, handles: string[], userAddress: string) => Promise<bigint[]>;
}

const FhevmContext = createContext<FhevmContextType | undefined>(undefined);

export function FhevmProvider({ children }: { children: ReactNode }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<BrowserProvider | null>(null);

  const initialize = useCallback(async (provider: BrowserProvider, chainId: number, eip1193Provider?: any) => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Pass the original EIP-1193 provider if available
      const fhevmInstance = await createFhevmInstance({ 
        provider, 
        chainId,
        eip1193Provider // Pass the raw provider directly
      });
      setInstance(fhevmInstance);
      setCurrentProvider(provider);
    } catch (err: any) {
      console.error('Failed to initialize FHEVM:', err);
      setError(err.message || 'Failed to initialize FHEVM');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const userDecrypt = useCallback(async (
    contractAddress: string,
    handles: string[],
    userAddress: string
  ): Promise<bigint[]> => {
    if (!instance || !currentProvider) {
      throw new Error('FHEVM instance or provider not initialized');
    }

    console.log('userDecrypt called with:', { contractAddress, handles, userAddress });

    // Helper to convert hex string to Uint8Array
    const hexToUint8Array = (hex: string): Uint8Array => {
      const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
      const bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
      }
      return bytes;
    };

    // Use userDecrypt with array of handle objects (like reference project)
    if (typeof (instance as any).userDecrypt === 'function') {
      console.log('✓ Using instance.userDecrypt');
      
      // Generate keypair for decryption
      const { publicKey, privateKey } = instance.generateKeypair();
      console.log('  Generated keypair for decryption');
      
      // Convert handles to the format expected by userDecrypt
      const handleObjects = handles.map(handle => ({
        handle: hexToUint8Array(handle),
        contractAddress: contractAddress,
      }));
      
      console.log('  Handle objects:', handleObjects.length);
      
      try {
        // Create EIP-712 signature for decryption
        const startTimestamp = Math.floor(Date.now() / 1000);
        const durationDays = 365;
        
        const eip712 = instance.createEIP712(
          publicKey,
          [contractAddress],
          startTimestamp,
          durationDays
        );
        
        console.log('  EIP-712 created, requesting signature...');
        
        // Get signer from current provider
        const signer = await currentProvider.getSigner();
        
        // Sign the EIP-712 typed data
        const signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );
        
        console.log('  Signature obtained, decrypting...');
        
        // For Mock mode, provide generated keypair and real signature
        const decryptedMap = await instance.userDecrypt(
          handleObjects,
          privateKey,
          publicKey,
          signature,
          [contractAddress],
          userAddress,
          startTimestamp,
          durationDays
        );
        
        console.log('  Decrypted map keys:', Object.keys(decryptedMap));
        
        // Extract results in the same order as input handles
        const results: bigint[] = [];
        for (const handle of handles) {
          const handleBytes = hexToUint8Array(handle);
          // Try both hex string key and buffer key
          const handleKey = '0x' + Array.from(handleBytes).map(b => b.toString(16).padStart(2, '0')).join('');
          const value = decryptedMap[handleKey] || decryptedMap[handle] || BigInt(0);
          console.log(`  Handle ${handle.slice(0, 20)}... → ${value}`);
          results.push(value);
        }
        
        console.log('✓ All values decrypted:', results);
        return results;
      } catch (error) {
        console.error('userDecrypt failed:', error);
        throw error;
      }
    }
    
    throw new Error('FHEVM instance does not have userDecrypt method');
  }, [instance, currentProvider]);

  return (
    <FhevmContext.Provider
      value={{
        instance,
        isInitializing,
        error,
        initialize,
        userDecrypt,
      }}
    >
      {children}
    </FhevmContext.Provider>
  );
}

export function useFhevm() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevm must be used within FhevmProvider');
  }
  return context;
}

