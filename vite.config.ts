import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/nep/', // BURA ÇOK ÖNEMLİ! GitHub Pages bu klasör adını arar.
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  clearScreen: false
});
