import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      electron: resolve(__dirname, 'test/mocks/electron.ts')
    }
  },
  test: {
    environment: 'node'
  }
})
