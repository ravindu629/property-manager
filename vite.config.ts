import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// Development only: @pdfme/converter (used for pdfme demo thumbnails) starts a worker from
// "assets/clawpdf-worker-*.js" next to its own code. Vite's dev pre-bundling moves that code
// into node_modules/.vite/deps but not the worker file, so the browser gets a 404.
// This serves the worker from the package folder. Production builds copy it automatically.
function pdfmeConverterWorker(): Plugin {
  const assetsDir = fileURLToPath(new URL('./node_modules/@pdfme/converter/dist/assets', import.meta.url));
  return {
    name: 'pdfme-converter-worker',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.match(/\/node_modules\/\.vite\/deps\/assets\/(clawpdf-worker-[\w-]+\.js(?:\.map)?)/);
        const file = match && path.join(assetsDir, match[1]);
        if (!file || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', 'text/javascript');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pdfmeConverterWorker()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
