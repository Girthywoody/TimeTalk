import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      writeBundle() {
        // Copy service worker to dist folder
        fs.copyFileSync(
          'public/firebase-messaging-sw.js',
          'dist/firebase-messaging-sw.js'
        );
      },
    },
  ],
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    https: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  preview: {
    host: true,
    https: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  }
});