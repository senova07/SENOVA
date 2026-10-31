import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Contrat partagé avec l'API (types de session, permissions).
      '@shared': fileURLToPath(new URL('./api/shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    // L'API tourne à côté (AdonisJS, port 3333). Passer par le même hôte évite
    // le cross-origin : le cookie de session et le jeton XSRF suivent.
    //
    // La clé est une expression régulière — elle commence par `^` — parce que
    // `api/shared/` est un dossier du dépôt, que Vite sert sous /api/shared/…
    // en développement. Un proxy sur `/api` tout court happerait ces modules
    // partagés et les enverrait à AdonisJS, qui répondrait 404 : l'application
    // ne démarrerait plus du tout.
    proxy: {
      // API_PORT : quand 3333 est déjà pris (ex. Relook lancé en même temps).
      '^/api/(?!shared/)': {
        target: `http://localhost:${process.env.API_PORT ?? 3333}`,
        changeOrigin: false,
      },
    },
  },
  test: {
    // Le front seulement : les suites de l'API sont écrites pour Japa, qui
    // refuse d'être importé par un autre lanceur.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
