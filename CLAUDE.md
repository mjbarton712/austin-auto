# Austin Auto

- Overview, architecture and dev setup: `README.md`. Older design notes: `docs/`.
- Never put secrets behind a `VITE_` prefix; everything with that prefix is public in the bundle. Server secrets go in Vercel env vars and are read only in `api/`.
- New `/api` routes must call `authenticate()` from `api/_lib/auth.ts` first.
- Checks: `npm run type-check && npm run lint && npm test && npm run build`. API tests live in `tests/` (not `api/`, which Vercel deploys as functions).
- The Supabase publishable key (env name `VITE_SUPABASE_ANON_KEY`) is public by design; table access relies on row-level security. The legacy anon/service_role JWT keys are disabled.
- Local-only test account and a script to run `api/` locally live in `.local/` (gitignored, may not exist on another machine). Sign in as the test user only on localhost.
