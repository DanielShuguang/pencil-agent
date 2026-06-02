import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: '[name].mjs'
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('packages/shared-types')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
