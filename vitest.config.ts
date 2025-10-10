import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'lcov'],
        reportsDirectory: 'coverage',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/__tests__/**'],
        all: true,
      },
    },
  }),
);
