import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

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
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
