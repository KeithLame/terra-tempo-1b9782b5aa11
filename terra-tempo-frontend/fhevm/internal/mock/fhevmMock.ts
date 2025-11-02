/**
 * FHEVM Mock Utilities Wrapper
 * Loads @fhevm/mock-utils only in localhost environment
 * 
 * WARNING: Always dynamically import this file to avoid including
 * the entire FHEVM mock library in the production bundle!
 */

import { JsonRpcProvider } from 'ethers';

// Fallback localhost FHEVM precompiled contract addresses (used if metadata fetch fails)
const FALLBACK_LOCALHOST_FHEVM_CONFIG = {
  ACLAddress: '0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D' as `0x${string}`,
  InputVerifierAddress: '0x901F8942346f7AB3a01F6D7613119Bca447Bb030' as `0x${string}`,
  KMSVerifierAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC' as `0x${string}`,
  verifyingContractAddressDecryption: '0x5ffdaAB0373E62E2ea2944776209aEf29E631A64' as `0x${string}`,
  verifyingContractAddressInputVerification: '0x812b06e1CDCE800494b79fFE4f925A504a9A9810' as `0x${string}`,
  gatewayChainId: 55815,
};

export function isMockEnvironment(chainId: number, provider: any): boolean {
  if (typeof window === 'undefined') return false;
  
  // For dev:mock mode, treat all localhost (31337) as Mock environment
  return chainId === 31337;
}

/**
 * Fetch FHEVM relayer metadata from Hardhat node
 * Returns the actual contract addresses from the running node
 */
async function fetchFHEVMRelayerMetadata(rpcUrl: string): Promise<{
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
} | null> {
  const rpc = new JsonRpcProvider(rpcUrl);
  try {
    const metadata = await rpc.send('fhevm_relayer_metadata', []);
    if (
      metadata &&
      typeof metadata === 'object' &&
      'ACLAddress' in metadata &&
      'InputVerifierAddress' in metadata &&
      'KMSVerifierAddress' in metadata
    ) {
      return {
        ACLAddress: metadata.ACLAddress as `0x${string}`,
        InputVerifierAddress: metadata.InputVerifierAddress as `0x${string}`,
        KMSVerifierAddress: metadata.KMSVerifierAddress as `0x${string}`,
      };
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Failed to fetch FHEVM relayer metadata:', error);
    return null;
  } finally {
    rpc.destroy();
  }
}

export async function createMockInstance(chainId: number, provider: any) {
  // Dynamically import MockFhevmInstance to avoid bundling in production
  const { MockFhevmInstance } = await import('@fhevm/mock-utils');
  const { Contract } = await import('ethers');
  
  // Create JsonRpcProvider for Mock instance
  const rpcUrl = 'http://127.0.0.1:8545';
  const jsonRpcProvider = new JsonRpcProvider(rpcUrl);
  
  // Try to fetch metadata from Hardhat node (preferred method)
  let metadata = await fetchFHEVMRelayerMetadata(rpcUrl);
  
  if (!metadata) {
    console.warn('⚠️ Could not fetch FHEVM metadata from Hardhat node, using fallback addresses');
    console.warn('⚠️ Make sure Hardhat node is running: cd fhevm-hardhat-template && npx hardhat node');
    metadata = {
      ACLAddress: FALLBACK_LOCALHOST_FHEVM_CONFIG.ACLAddress,
      InputVerifierAddress: FALLBACK_LOCALHOST_FHEVM_CONFIG.InputVerifierAddress,
      KMSVerifierAddress: FALLBACK_LOCALHOST_FHEVM_CONFIG.KMSVerifierAddress,
    };
  } else {
    console.log('✓ Fetched FHEVM metadata from Hardhat node:', metadata);
  }
  
  // CRITICAL: Fetch InputVerifier EIP712 domain to get correct verifyingContract and chainId
  // This is required by MockFhevmInstance.createEncryptedInput assertions
  let verifyingContractAddressInputVerification = FALLBACK_LOCALHOST_FHEVM_CONFIG.verifyingContractAddressInputVerification;
  let gatewayChainId = FALLBACK_LOCALHOST_FHEVM_CONFIG.gatewayChainId;
  
  try {
    const inputVerifierABI = [
      'function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])'
    ];
    const inputVerifierContract = new Contract(metadata.InputVerifierAddress, inputVerifierABI, jsonRpcProvider);
    const domain = await inputVerifierContract.eip712Domain();
    // domain[4] is verifyingContract, domain[3] is chainId
    verifyingContractAddressInputVerification = domain[4] as `0x${string}`;
    gatewayChainId = Number(domain[3]);
    console.log('✓ Fetched InputVerifier EIP712 domain:', {
      verifyingContract: verifyingContractAddressInputVerification,
      chainId: gatewayChainId,
    });
  } catch (error) {
    console.warn('⚠️ Failed to fetch InputVerifier EIP712 domain, using fallback values:', error);
    console.warn('⚠️ This may cause "Fhevm assertion failed" error');
  }
  
  // FHEVM v0.9: MockFhevmInstance.create now requires a 4th parameter (properties)
  const instance = await MockFhevmInstance.create(
    jsonRpcProvider,
    jsonRpcProvider,
    {
      aclContractAddress: metadata.ACLAddress,
      chainId: chainId,
      gatewayChainId: gatewayChainId,
      inputVerifierContractAddress: metadata.InputVerifierAddress,
      kmsContractAddress: metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption: FALLBACK_LOCALHOST_FHEVM_CONFIG.verifyingContractAddressDecryption,
      verifyingContractAddressInputVerification: verifyingContractAddressInputVerification,
    },
    {
      // v0.9 requires properties parameter
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );
  
  console.log('✓ FHEVM Mock instance created successfully (v0.9)');
  return instance;
}

