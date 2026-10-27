import path from "path"
import react from "@vitejs/plugin-react"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  // `vite` alone doesn't serve /api. Point API_PROXY_TARGET at a deployment
  // (or `vercel dev`) to exercise photo uploads and Claude locally.
  const apiTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: apiTarget
      ? { proxy: { '/api': { target: apiTarget, changeOrigin: true } } }
      : undefined,
    test: {
      include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      // Needs real Supabase credentials; run with `npm run test:integration`
      exclude: ['tests/integration/**', 'node_modules/**'],
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
