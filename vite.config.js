import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [cesium()],
  server: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/health': 'http://localhost:8787'
    }
  },
  build: { target: 'es2022', sourcemap: true }
});
