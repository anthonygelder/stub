import { defineConfig, configDefaults } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    fileParallelism: false,
    pool: 'forks',
    // Don't pick up compiled test files if a build has emitted to dist/.
    exclude: [...configDefaults.exclude, '**/dist/**'],
  },
});
