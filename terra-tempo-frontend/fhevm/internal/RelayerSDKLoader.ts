/**
 * Dynamic Relayer SDK Loader
 * Loads @zama-fhe/relayer-sdk via CDN injection (window.relayerSDK)
 * Follows the approach of reference frontend but simplified
 */

import { FHEVM_CONSTANTS } from './constants';

let sdkLoadingPromise: Promise<any> | null = null;
let isLoading = false;

/**
 * Load Relayer SDK by injecting CDN script
 * Returns promise that resolves when window.relayerSDK is available
 */
export async function loadRelayerSDK(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Relayer SDK can only be loaded in browser environment');
  }

  // If already loaded, return immediately (no log spam)
  if ((window as any).relayerSDK) {
    return (window as any).relayerSDK;
  }

  // If loading in progress, return the same promise
  if (sdkLoadingPromise) {
    return sdkLoadingPromise;
  }

  // Prevent concurrent loading attempts
  if (isLoading) {
    // Wait for ongoing load
    await new Promise(resolve => setTimeout(resolve, 100));
    return loadRelayerSDK();
  }

  isLoading = true;

  // Start loading
  sdkLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src="${FHEVM_CONSTANTS.SDK_CDN_URL}"]`
    );

    if (existingScript) {
      // Script exists, check if SDK loaded
      if ((window as any).relayerSDK) {
        isLoading = false;
        resolve((window as any).relayerSDK);
      } else {
        // Wait for script to finish loading
        setTimeout(() => {
          if ((window as any).relayerSDK) {
            isLoading = false;
            resolve((window as any).relayerSDK);
          } else {
            isLoading = false;
            reject(new Error('Relayer SDK script exists but window.relayerSDK not available'));
          }
        }, 1000);
      }
      return;
    }

    // Create new script element
    const script = document.createElement('script');
    script.src = FHEVM_CONSTANTS.SDK_CDN_URL;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      isLoading = false;
      if ((window as any).relayerSDK) {
        console.log('✓ Relayer SDK loaded from CDN');
        resolve((window as any).relayerSDK);
      } else {
        reject(new Error('Relayer SDK script loaded but window.relayerSDK not available'));
      }
    };

    script.onerror = () => {
      isLoading = false;
      sdkLoadingPromise = null; // Allow retry
      reject(new Error(`Failed to load Relayer SDK from ${FHEVM_CONSTANTS.SDK_CDN_URL}`));
    };

    document.head.appendChild(script);
  });

  return sdkLoadingPromise;
}

/**
 * Check if Relayer SDK is already loaded
 */
export function isRelayerSDKAvailable(): boolean {
  return typeof window !== 'undefined' && (window as any).relayerSDK !== undefined;
}
