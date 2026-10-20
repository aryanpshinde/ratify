import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'api-integration',
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup-env.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
