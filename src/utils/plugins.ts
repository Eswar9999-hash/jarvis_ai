import { eventBus } from './eventBus';
import { config } from './config';

export type Plugin = {
  name: string;
  setup: () => void;
};

const registry: Plugin[] = [];

export const registerPlugin = (plugin: Plugin) => {
  if (!config.features.plugins) return;
  registry.push(plugin);
  try { plugin.setup(); } catch {/* noop */}
};

export const emitEvent = (event: string, payload?: any) => {
  if (!config.features.plugins) return;
  eventBus.emit(event, payload);
};