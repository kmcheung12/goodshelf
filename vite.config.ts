import { defineConfig, loadEnv, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isExtension = env.VITE_IS_EXTENSION === 'true';
  const browser    = env.VITE_BROWSER || 'chrome';
  const outDir     = isExtension ? `dist-${browser}` : 'dist';

  const copyManifest: Plugin = {
    name: 'copy-manifest',
    closeBundle() {
      copyFileSync(
        resolve(__dirname, `extension/manifest-${browser}.json`),
        resolve(__dirname, `${outDir}/manifest.json`),
      );
    },
  };

  return {
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: isExtension
        ? {
            input: {
              index: resolve(__dirname, 'index.html'),
              'service-worker': resolve(__dirname, 'src/extension/service-worker.ts'),
            },
            output: {
              // Keep service-worker.js unhashed so the manifest can reference it by name
              entryFileNames: (chunk) =>
                chunk.name === 'service-worker' ? '[name].js' : 'assets/[name]-[hash].js',
              chunkFileNames: 'assets/[name]-[hash].js',
            },
          }
        : undefined,
    },
    plugins: [svelte(), ...(isExtension ? [copyManifest] : [])],
  };
});
