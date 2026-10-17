import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin pour garantir que Vercel sert index.html sur toutes les routes client (ex: /admin/login)
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexHtml = path.join(distDir, 'index.html')
      if (fs.existsSync(indexHtml)) {
        // 1. Fallback global Vercel (404.html)
        fs.copyFileSync(indexHtml, path.join(distDir, '404.html'))

        // 2. Fichiers physiques pour chaque route principale
        const routes = [
          'admin',
          'admin/login',
          'admin/produits',
          'admin/collections',
          'admin/stock',
          'admin/commandes',
          'catalogue',
          'contact',
          'cart',
          'panier',
          'checkout',
          'commander',
        ]
        routes.forEach((route) => {
          const targetDir = path.join(distDir, route)
          fs.mkdirSync(targetDir, { recursive: true })
          fs.copyFileSync(indexHtml, path.join(targetDir, 'index.html'))
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
