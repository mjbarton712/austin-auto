import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Check if we're building for GitHub Pages or Vercel
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

export default defineConfig({
  // Conditionally set the base URL
  base: isGitHubPages ? '/austin-auto/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Keep the GitHub Pages optimization if needed
    ...(isGitHubPages && {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    }),
  }
})