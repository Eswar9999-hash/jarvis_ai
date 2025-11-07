export type FeatureFlags = {
  logging: boolean;
  cache: boolean;
  jobQueue: boolean;
  plugins: boolean;
  analytics: boolean;
  lazy: boolean;
};

const readBool = (v: string | undefined, fallback = false) => {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'on' || s === 'yes';
};

export const config = {
  features: {
    logging: readBool(import.meta.env.VITE_FEATURE_LOGGING, false),
    cache: readBool(import.meta.env.VITE_FEATURE_CACHE, false),
    jobQueue: readBool(import.meta.env.VITE_FEATURE_JOBQUEUE, false),
    plugins: readBool(import.meta.env.VITE_FEATURE_PLUGINS, false),
    analytics: readBool(import.meta.env.VITE_FEATURE_ANALYTICS, false),
    lazy: readBool(import.meta.env.VITE_FEATURE_LAZY, false),
  } as FeatureFlags,
};