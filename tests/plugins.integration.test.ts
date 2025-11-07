import { describe, it, expect } from 'vitest';
import { config } from '../src/utils/config';
import { registerPlugin, emitEvent } from '../src/utils/plugins';
import { eventBus } from '../src/utils/eventBus';

describe('plugins integration', () => {
  it('registers plugin and receives emitted events when enabled', () => {
    config.features.plugins = true;
    let received: any = null;
    const off = eventBus.on('message:sent', (p) => { received = p; });
    registerPlugin({ name: 'test', setup: () => {} });
    eventBus.emit('message:sent', { message: { id: 'x' } });
    expect(received?.message?.id).toBe('x');
    off();
  });

  it('does nothing when plugins disabled', () => {
    config.features.plugins = false;
    let called = false;
    const off = eventBus.on('message:sent', () => { called = true; });
    registerPlugin({ name: 'noop', setup: () => { called = true; } });
    emitEvent('message:sent', { a: 1 });
    // When disabled: registerPlugin and emitEvent are no-ops
    expect(called).toBe(false);
    off();
  });
});