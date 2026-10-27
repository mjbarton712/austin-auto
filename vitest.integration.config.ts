import path from 'path'
import { defineConfig } from 'vitest/config'

// Runs against a real Supabase project; see tests/integration/rls.test.ts for required env vars.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { include: ['tests/integration/**/*.test.ts'], testTimeout: 30_000 },
})
