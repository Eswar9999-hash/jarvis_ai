import { describe, it, expect } from 'vitest';
import { globalCache } from '../src/utils/cache';
import { config } from '../src/utils/config';

describe('SimpleCache', () => {
  it('returns undefined when feature flag is off', () => {
    config.features.cache = false;
    globalCache.set('k', 123, 10_000);
    expect(globalCache.get('k')).toBeUndefined();
  });

  it('stores and retrieves within TTL when enabled', () => {
    config.features.cache = true;
    globalCache.clear();
    globalCache.set('k', { a: 1 }, 50);
    const v = globalCache.get<{ a: number }>('k');
    expect(v?.a).toBe(1);
  });

  it('expires entries after TTL', async () => {
    config.features.cache = true;
    globalCache.clear();
    globalCache.set('expiring', 'x', 5);
    await new Promise(r => setTimeout(r, 10));
    expect(globalCache.get('expiring')).toBeUndefined();
  });
});