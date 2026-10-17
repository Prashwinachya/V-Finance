import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function syncToLaravelPublic() {
  return {
    name: 'sync-to-laravel-public',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const laravelPublicDir = path.resolve(__dirname, '../../public/vfinance')

      try {
        if (fs.existsSync(path.resolve(__dirname, '../../public'))) {
          fs.mkdirSync(laravelPublicDir, { recursive: true })
          fs.cpSync(distDir, laravelPublicDir, { recursive: true })
          console.log('✓ Successfully synced build assets to public/vfinance for Laravel')
        }
      } catch (err) {
        console.warn('Note: Could not sync to public/vfinance:', err?.message || err)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(() => ({
  base: '/',
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
  },
  plugins: [react(), syncToLaravelPublic()],
}))
