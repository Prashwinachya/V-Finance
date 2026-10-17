import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import http from 'node:http'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function ensureLaravelBackend() {
  let backendProcess = null

  return {
    name: 'ensure-laravel-backend',
    configureServer(server) {
      const rootDir = path.resolve(__dirname, '../../')
      const artisanPath = path.resolve(rootDir, 'artisan')

      const req = http.get('http://127.0.0.1:8000', () => {
        // Backend is already active
      })

      req.on('error', () => {
        if (fs.existsSync(artisanPath)) {
          console.log('[vite] Starting Laravel backend proxy on http://127.0.0.1:8000...')
          backendProcess = spawn('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], {
            cwd: rootDir,
            stdio: 'ignore',
          })

          backendProcess.on('error', (err) => {
            console.warn('[vite] Could not auto-start Laravel backend:', err.message)
          })
        }
      })

      const cleanup = () => {
        if (backendProcess) {
          try {
            backendProcess.kill()
          } catch {
            // ignore
          }
          backendProcess = null
        }
      }

      server.httpServer?.on('close', cleanup)
      process.on('exit', cleanup)
      process.on('SIGINT', cleanup)
      process.on('SIGTERM', cleanup)
    },
  }
}

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
  plugins: [react(), syncToLaravelPublic(), ensureLaravelBackend()],
}))
