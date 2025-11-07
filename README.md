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

## Vercel Deployment

This app uses Vite’s `import.meta.env` and requires build-time environment variables prefixed with `VITE_`.

Required variables:
- `VITE_GEMINI_API_KEY`: Google Gemini API key.
- Optional: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Setup on Vercel:
- Go to Vercel Dashboard → Project → Settings → Environment Variables.
- Add `VITE_GEMINI_API_KEY` for Production and Preview.
- If using Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Redeploy the project.

Local development:
- Create `.env.local` (ignored by Git) and copy from `.env.example`.
- Start dev server: `npm run dev`.

Notes:
- `.env`, `.env.local`, `.env.production`, and `.env.preview` are ignored in Git. Use Vercel’s environment settings for deployment.
- Only variables prefixed with `VITE_` are exposed to the client in Vite builds.