import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

// One id per build: compiled into the app and written to /version.json, so a
// running app can tell when a newer build has been deployed (UpdateBanner).
const BUILD_ID = Date.now().toString(36);
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) });
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: Number(env.PORT) || 3000,
        host: '0.0.0.0',
      },
      preview: {
        port: Number(env.PORT) || 8080,
        host: '0.0.0.0',
      },
      plugins: [react(), versionFile()],
      define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
