import { STORAGE_KEYS } from '../lib/constants';
import { GenericStringStorage } from './GenericStringStorage';

export class FhevmDecryptionSignature {
  private storage: GenericStringStorage;

  constructor(userAddress: string) {
    const key = STORAGE_KEYS.FHEVM_DECRYPTION_SIGNATURE(userAddress);
    this.storage = new GenericStringStorage(key);
  }

  get(): string | null {
    return this.storage.get();
  }

  set(signature: string): void {
    this.storage.set(signature);
  }

  remove(): void {
    this.storage.remove();
  }
}


