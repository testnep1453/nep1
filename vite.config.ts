import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/nep1/', // İŞTE KRİTİK NOKTA BURASI! Reponun adıyla TAM AYNI olmalı.
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
