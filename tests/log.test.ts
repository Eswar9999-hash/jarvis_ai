import { describe, it, expect } from 'vitest';
import { config } from '../src/utils/config';
import { log } from '../src/utils/log';

describe('log', () => {
  it('is no-op when logging disabled', () => {
    config.features.logging = false;
    expect(() => log.info('test')).not.toThrow();
    expect(() => log.warn('test')).not.toThrow();
    expect(() => log.error('test')).not.toThrow();
    expect(() => log.event('evt')).not.toThrow();
  });

  it('calls without throwing when enabled', () => {
    config.features.logging = true;
    expect(() => log.info('hello')).not.toThrow();
  });
});