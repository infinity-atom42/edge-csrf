/// <reference types="vitest" />
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from 'path';

export default defineWorkersConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared/src'),
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