import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: false,
    headers: {
      'Cache-Control': 'no-store',
    },
    watch: {
      ignored: ['**/public/**', '**/.git/**', '**/dist/**'],
    },
  },
  optimizeDeps: {
    include: ['@react-three/rapier', '@react-three/postprocessing', 'three']
  }
});
