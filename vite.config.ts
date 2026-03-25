import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false // HMR error overlay'i kapat
    }
  },
  clearScreen: false // Terminal ekranını temizlemeyi kapat
});
