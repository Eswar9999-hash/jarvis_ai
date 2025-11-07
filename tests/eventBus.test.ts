import { describe, it, expect } from 'vitest';
import { eventBus } from '../src/utils/eventBus';

describe('eventBus', () => {
  it('subscribes and emits events', () => {
    let called = false;
    const off = eventBus.on('ping', (p) => { if (p?.x === 1) called = true; });
    eventBus.emit('ping', { x: 1 });
    expect(called).toBe(true);
    off();
  });
});