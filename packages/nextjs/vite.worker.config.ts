/// <reference types="vitest" />
import { resolve } from 'path';
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

import dts from '../../shared/src/vite-plugin-dts';

export default defineWorkersConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared/src'),
    },
  },
  plugins: [dts()],
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
      ],
      name: '@edge-csrf/nextjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['next/server', 'react', 'react-dom'],
    },
  },
  test: {
    poolOptions: {
      workers: {
        miniflare: {
          compatibilityDate: "2023-01-01",
        }
      }
    },
    globals: true
  },
});
