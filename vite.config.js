import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        app: './index.html',
        'firebase-messaging-sw': './public/firebase-messaging-sw.js'
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Enables external access
    https: true, // Enable HTTPS for iOS features
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
  },
  // Add a custom build step to copy firebase-messaging-sw.js to the build output
  experimental: {
    renderBuiltUrl(filename) {
      if (filename.includes('firebase-messaging-sw.js')) {
        return '/firebase-messaging-sw.js';
      }
      return filename;
    }
  }
});