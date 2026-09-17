import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The web build is served from a subdirectory on GitHub Pages and from the file system inside
  // the desktop shell, so every asset reference is relative.
  base: './',
  build: {
    outDir: '../../docs',
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
