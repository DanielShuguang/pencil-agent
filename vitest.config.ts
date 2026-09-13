import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('packages/shared-types')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/renderer/src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // 统计所有源码文件，未加载的文件按 0% 计入，避免“被遗忘的模块”隐身
      include: ['src/**/*.{ts,tsx}', 'packages/*/**/*.ts'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        'src/renderer/src/test-setup.ts',
        'src/**/*.d.ts',
        'src/main/index.ts',
        'src/renderer/src/main.tsx'
      ],
      // 全局门槛：低于阈值时 test:coverage 直接失败，防止覆盖率回退
      thresholds: {
        statements: 85,
        branches: 74,
        functions: 85,
        lines: 87
      }
    }
  }
})
