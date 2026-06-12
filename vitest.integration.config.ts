import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve('packages/shared-types'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.{test,spec}.ts'],
    envDir: '.',
  },
})
