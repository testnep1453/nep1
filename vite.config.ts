import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vite plugin: Build sonrası firebase-messaging-sw.js içindeki
 * placeholder'ları .env değerleriyle değiştirir
 */
function firebaseSWPlugin(): Plugin {
  return {
    name: 'firebase-sw-env-inject',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');
      if (!fs.existsSync(swPath)) return;

      let content = fs.readFileSync(swPath, 'utf-8');

      const envMap: Record<string, string> = {
        '__VITE_FIREBASE_API_KEY__': process.env.VITE_FIREBASE_API_KEY || '',
        '__VITE_FIREBASE_AUTH_DOMAIN__': process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        '__VITE_FIREBASE_PROJECT_ID__': process.env.VITE_FIREBASE_PROJECT_ID || '',
        '__VITE_FIREBASE_STORAGE_BUCKET__': process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
        '__VITE_FIREBASE_MESSAGING_SENDER_ID__': process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        '__VITE_FIREBASE_APP_ID__': process.env.VITE_FIREBASE_APP_ID || '',
      };

      for (const [placeholder, value] of Object.entries(envMap)) {
        content = content.replaceAll(placeholder, value);
      }

      fs.writeFileSync(swPath, content, 'utf-8');
    },
  };
}

export default defineConfig({
  plugins: [react(), firebaseSWPlugin()],
  base: '/nep1/',
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
