import { config } from './config';

type LogPayload = unknown[];

const prefix = '[Jarvis]';

export const log = {
  info: (...args: LogPayload) => {
    if (!config.features.logging) return;
    // Use console.info to avoid altering behavior
    // eslint-disable-next-line no-console
    console.info(prefix, ...args);
  },
  warn: (...args: LogPayload) => {
    if (!config.features.logging) return;
    // eslint-disable-next-line no-console
    console.warn(prefix, ...args);
  },
  error: (...args: LogPayload) => {
    if (!config.features.logging) return;
    // eslint-disable-next-line no-console
    console.error(prefix, ...args);
  },
  event: (name: string, payload?: Record<string, unknown>) => {
    if (!config.features.logging) return;
    // eslint-disable-next-line no-console
    console.log(`${prefix} event:${name}`, payload ?? {});
  },
};