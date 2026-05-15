import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,     // disable sourcemaps in production for security
    minify: 'esbuild',    // fast minification
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large vendor chunks for faster loading
        manualChunks: {
          react:  ['react', 'react-dom'],
          router: ['react-router-dom'],
          axios:  ['axios'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
})
