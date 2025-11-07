# JARVIS_PAI

## Development

Run the development server:

```bash
npm run dev
```

## Enhancements (Feature Flags)

Optional, default-off enhancements are available via environment variables. When disabled, behavior is unchanged:

- `VITE_FEATURE_LOGGING`: Enable structured console logging.
- `VITE_FEATURE_CACHE`: Enable short-lived in-memory caching for message loads.
- `VITE_FEATURE_JOBQUEUE`: Defer non-critical jobs to idle time.
- `VITE_FEATURE_PLUGINS`: Enable plugin event bus emissions.
- `VITE_FEATURE_ANALYTICS`: Enable basic analytics event logging.
- `VITE_FEATURE_LAZY`: Reserved for optional lazy-loaded panels.

Example `.env`:

```
VITE_FEATURE_LOGGING=true
VITE_FEATURE_CACHE=true
```

## Testing

Install dev dependencies and run tests:

```bash
npm install
npm run test
```