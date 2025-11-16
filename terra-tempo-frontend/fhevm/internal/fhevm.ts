/**
 * FHEVM Instance Management
 * Handles both Mock (localhost) and Real (Sepolia) modes
 */

import { BrowserProvider } from 'ethers';
import { isMockEnvironment, createMockInstance } from './mock/fhevmMock';
import { loadRelayerSDK } from './RelayerSDKLoader';
import { FHEVM_CONSTANTS } from './constants';

export type FhevmInstance = any; // Will be properly typed by imported modules

export interface CreateFhevmInstanceParams {
  provider: BrowserProvider;
  chainId: number;
  contractAddress?: string;
  eip1193Provider?: any; // Optional: raw EIP-1193 provider
}

export async function createFhevmInstance({
  provider,
  chainId,
  contractAddress,
  eip1193Provider,
}: CreateFhevmInstanceParams): Promise<FhevmInstance> {
  // Get the EIP-1193 provider (prefer passed one, fallback to extracting from BrowserProvider)
  const ethereumProvider = eip1193Provider || (provider as any).provider;
  
  // Check if we should use mock environment (localhost development)
  if (isMockEnvironment(chainId, ethereumProvider)) {
    console.log('🧪 Creating FHEVM Mock instance (localhost)');
    return await createMockInstance(chainId, ethereumProvider);
  }

  // Real environment (Sepolia/Mainnet)
  console.log('🔐 Creating FHEVM Real instance (Sepolia/Mainnet)');
  
  // Load SDK from CDN (window.relayerSDK)
  const relayerSDK = await loadRelayerSDK();
  
  if (chainId === FHEVM_CONSTANTS.SEPOLIA_CHAIN_ID) {
    // v0.9: Initialize SDK without parameters (only once globally)
    if (!relayerSDK.__initialized__) {
      try {
        await relayerSDK.initSDK();
        relayerSDK.__initialized__ = true;
        console.log('✓ SDK initialized successfully');
      } catch (err: any) {
        // If already initialized, ignore the error
        if (err.message && err.message.includes('already initialized')) {
          relayerSDK.__initialized__ = true;
          console.log('⚠️ SDK was already initialized');
        } else {
          console.error('❌ SDK initialization failed:', err);
          throw err;
        }
      }
    }
    
    // ethereumProvider already extracted at the top (line 27)
    // Fallback: if not available, try window.ethereum directly
    if (!ethereumProvider && typeof window !== 'undefined') {
      (ethereumProvider as any) = (window as any).ethereum;
      console.log('⚠️ Using window.ethereum as fallback');
    }
    
    // Validate provider
    if (!ethereumProvider || typeof ethereumProvider.request !== 'function') {
      console.error('Provider validation failed:', {
        hasProvider: !!ethereumProvider,
        hasRequest: ethereumProvider ? typeof ethereumProvider.request === 'function' : false,
        providerType: typeof ethereumProvider,
      });
      throw new Error('Invalid EIP-1193 provider: missing request method');
    }
    
    console.log('✓ EIP-1193 provider validated:', {
      hasRequest: typeof ethereumProvider.request === 'function',
      hasOn: typeof ethereumProvider.on === 'function',
    });
    
    // Use SDK's built-in SepoliaConfig (like reference frontend)
    const config = {
      ...relayerSDK.SepoliaConfig,
      network: ethereumProvider, // Must be EIP-1193 provider, not BrowserProvider
    };
    
    console.log('✓ Creating FHEVM instance with config:', {
      hasSepoliaConfig: !!relayerSDK.SepoliaConfig,
      configKeys: Object.keys(config),
    });
    
    try {
      const instance = await relayerSDK.createInstance(config);
      console.log('✅ FHEVM instance created successfully');
      return instance;
    } catch (err: any) {
      console.error('❌ Failed to create FHEVM instance:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        config: { ...config, network: '[EIP-1193 Provider]' }, // Don't log the provider object
      });
      throw err;
    }
  }

  throw new Error(`Unsupported chainId: ${chainId}`);
}

export async function userDecrypt(
  instance: FhevmInstance,
  contractAddress: string,
  encryptedHandle: bigint,
  userAddress: string,
  signature?: string
): Promise<bigint> {
  // Mock mode
  if (instance.userDecrypt && !signature) {
    return await instance.userDecrypt(contractAddress, encryptedHandle);
  }

  // Real mode (requires signature)
  if (!signature) {
    throw new Error('Signature required for decryption in real mode');
  }

  return await instance.userDecrypt(
    contractAddress,
    encryptedHandle,
    userAddress,
    signature
  );
}

