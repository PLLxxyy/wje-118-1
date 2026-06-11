import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    env: {
      VOLUNTEER_DB_MEMORY: '1',
    },
  },
});
