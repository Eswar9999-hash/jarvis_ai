import { config } from './config';

type CacheEntry<T> = { value: T; expiresAt: number };

export class SimpleCache {
  private store = new Map<string, CacheEntry<unknown>>();

  constructor(private defaultTtlMs = 30_000) {}

  get<T>(key: string): T | undefined {
    if (!config.features.cache) return undefined;
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    if (!config.features.cache) return;
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  invalidate(keyPrefix: string): void {
    if (!config.features.cache) return;
    for (const k of this.store.keys()) {
      if (k.startsWith(keyPrefix)) {
        this.store.delete(k);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const globalCache = new SimpleCache();