/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The browser only talks to Vite; Vite forwards /api/* to the FastAPI backend.
// Locally that is localhost:8000, inside docker compose it is the `backend` service.
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
  // Component tests (Vitest): `make test`. They run in a simulated browser (jsdom), no server.
  test: {
    environment: 'jsdom',
    // React's test helpers exist only in its development build
    env: { NODE_ENV: 'test' },
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { include: ['src/**'], exclude: ['src/api/schema.d.ts', 'src/test/**'] },
  },
})
