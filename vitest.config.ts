import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      './packages/shared/vitest.config.ts',
      './apps/api/vitest.config.ts',
      './apps/api/vitest.integration.config.ts',
    ],
  },
});
