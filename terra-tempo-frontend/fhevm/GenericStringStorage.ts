import { storage } from '../lib/utils';

export class GenericStringStorage {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(): string | null {
    return storage.get(this.key);
  }

  set(value: string): void {
    storage.set(this.key, value);
  }

  remove(): void {
    storage.remove(this.key);
  }
}


