import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-simple-maps') || id.includes('d3-geo') || id.includes('d3-scale') || id.includes('d3-array') || id.includes('topojson-client')) {
            return 'map-stack';
          }

          if (id.includes('recharts')) {
            return 'recharts-stack';
          }

          if (id.includes('react-redux')) {
            return 'analytics-vendor';
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('zustand')) {
            return 'framework';
          }

          return 'vendor';
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types']
  }
})
