# Austin Auto

Service-record app for a small auto shop: vehicles, jobs, photos, invoices (PDF), and a "Ask Claude" box.

## Stack

| Piece | What |
|---|---|
| Frontend | Vite + React + TypeScript, Tailwind, shadcn/ui (Radix), react-hook-form + zod |
| Auth + data | Supabase (email/password auth, Postgres: `cars_new`, `jobs`, `media`) |
| Photos | Cloudflare R2. Public URLs are stored in `media.url`; uploads and deletes go through `/api` |
| Backend | Vercel serverless functions in `api/` |
| Hosting | Vercel (`vercel.json` rewrites all paths to the SPA) |

## Architecture notes

- **Secrets stay on the server.** The browser only gets the Supabase publishable key and the R2 public URL.
  R2 credentials and `ANTHROPIC_API_KEY` are used only inside `api/` functions.
- **Every `/api` route verifies the caller's Supabase session** (`api/_lib/auth.ts`). Photo routes also
  check that the job in the object key belongs to the caller. Rely on Supabase row-level security
  (`user_id = auth.uid()`) for all table access from the browser.
- **Photos** are resized client-side (`src/lib/image.ts`) to stay under Vercel's 4.5 MB request limit.
  Object keys are `<job-id>/<uuid>.<ext>`; older migrated photos have other filenames and stay deletable.

## Develop

```bash
cp .env.example .env     # fill in the values
npm ci
npm run dev              # frontend only; /api isn't served by vite
```

To exercise uploads or Claude locally, run `vercel dev`, or set `API_PROXY_TARGET` in `.env` to a
deployment URL so vite proxies `/api` to it.

Checks (also run in CI): `npm run type-check`, `npm run lint`, `npm test`, `npm run build`.

`npm run test:integration` checks row-level security against a real Supabase project using two throwaway
accounts (env vars are listed at the top of `tests/integration/rls.test.ts`). It isn't part of CI.

Database changes live in `supabase/migrations/`; each has a matching undo script in `supabase/rollbacks/`.

## Deploy

Vercel builds on push to `main`. Set the server-side variables from `.env.example` in the Vercel
project settings. The R2 bucket needs public read access (custom domain or `r2.dev`) for photo URLs.
