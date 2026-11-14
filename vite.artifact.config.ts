import { defineConfig } from 'vite';

// Builds the app as one script that uses React from a CDN global, for publishing as a
// single self-contained page. See scripts/build-artifact.mjs.
export default defineConfig({
  define: { 'process.env.NODE_ENV': '"production"' },
  esbuild: { jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment' },
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: 'src/main.tsx', formats: ['iife'], name: 'ClaimLifecycle', fileName: () => 'app.js' },
    rollupOptions: {
      external: ['react', 'react-dom/client'],
      output: { globals: { react: 'React', 'react-dom/client': 'ReactDOM' }, assetFileNames: 'app.css' },
    },
  },
});
