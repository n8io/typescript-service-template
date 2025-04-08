import { defineConfig } from 'vitest/config'

// biome-ignore lint/style/noDefaultExport: This is a workaround for vitest's default export issue.
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'clover', 'lcov', 'json', 'json-summary'],
      reportOnFailure: true,
      thresholds: {
        branches: 90,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
    environment: 'node',
    globals: true,
  },
})
