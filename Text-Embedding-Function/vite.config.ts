import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'TextEmbeddingLib',
      fileName: (format) => `text-embedding-lib.${format}.js`
    },
    rollupOptions: {
      // External deps go here (e.g. react)
      external: [],
      output: {
        globals: {}
      }
    }
  }
})
