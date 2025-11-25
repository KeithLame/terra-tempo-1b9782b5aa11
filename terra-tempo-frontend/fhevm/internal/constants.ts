export const FHEVM_CONSTANTS = {
  LOCALHOST_CHAIN_ID: 31337,
  SEPOLIA_CHAIN_ID: 11155111,
  
  // FHEVM v0.9 Sepolia configuration
  SEPOLIA_CONFIG: {
    gatewayUrl: 'https://gateway.sepolia.zama.ai',
    aclAddress: '0xFEE8407e2f5e3Ee68ad77cAE98c434e637f516e5',
    kmsVerifierAddress: '0x9D6891A6240D6130c54ae243d8005063D05fE14b',
    executorAddress: '0xC9555eB23FF95D9D0d589f8fEA4E94e78b4Ad8A4',
    inputVerifierAddress: '0x7c63c0d2d66E0F2E551E0E71A0f0e2e9C8e8c9B7',
    // Decryption Oracle address (Gateway contract)
    decryptionOracleAddress: '0x508bA8305f2d86b48B9315067067Fb1Da8e2FEc4',
  },
  
  // CDN URL for Relayer SDK (injected into window.relayerSDK)
  // v0.9: Updated to 0.3.0-5 and cdn.zama.org
  SDK_CDN_URL: 'https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs',
  SDK_LOCAL_URL: '/relayer-sdk-js.umd.cjs',
} as const;

