type Handler = (payload?: any) => void;

class EventBus {
  private listeners = new Map<string, Set<Handler>>();

  on(event: string, handler: Handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: Handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, payload?: any) {
    this.listeners.get(event)?.forEach(fn => {
      try { fn(payload); } catch (e) { /* swallow */ }
    });
  }
}

export const eventBus = new EventBus();