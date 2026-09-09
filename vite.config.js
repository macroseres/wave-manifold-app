import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function manualChunks(id) {
  if (!id.includes('node_modules')) return null
  if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react'
  if (id.includes('/three/') || id.includes('@react-three')) return 'three'
  if (id.includes('/isosurface/')) return 'numerics'
  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // File notifications can be missed when edits come from the Windows sandbox.
    watch: { usePolling: true, interval: 1000 },
  },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
})
