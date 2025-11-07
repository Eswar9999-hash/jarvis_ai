import { config } from './config';
import { log } from './log';

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export const trackEvent = (evt: AnalyticsEvent) => {
  if (!config.features.analytics) return;
  // Default implementation: log only. Integrations can be added later.
  log.event(`analytics:${evt.name}`, evt.properties);
};