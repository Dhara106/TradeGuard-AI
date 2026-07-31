import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies /api to the Node gateway. The gateway's own port comes
// from backend-node/.env (PORT=5000), so that is the default here. Override with
// VITE_API_PROXY_TARGET when the gateway runs elsewhere — e.g. against the Docker
// stack, which publishes the gateway on host port 5001:
//   VITE_API_PROXY_TARGET=http://localhost:5001 npm run dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      // The two biggest chunks previously sat just under the 500 kB default, so no
      // warning ever fired. Lower it so growth is noticed.
      chunkSizeWarningLimit: 300,
      rollupOptions: {
        output: {
          // Split long-lived dependencies out of the entry chunk. This does not
          // reduce first-load bytes, but it stops an app-code edit from
          // invalidating the whole vendor payload for returning visitors.
          // Only packages that are ALREADY eager belong here. Forcing framer-motion
          // into a chunk collapses the lazy domMax split in motionFeatures.js and
          // makes it load up front; forcing @phosphor-icons into one chunk drags
          // every route's icons into the initial payload. Rollup splits both far
          // better on its own.
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined
            if (/[\\/]node_modules[\\/]react-router/.test(id)) return 'vendor-router'
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react'
            return undefined
          },
        },
      },
    },
  }
})
