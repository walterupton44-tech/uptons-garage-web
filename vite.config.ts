import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  build: {
    // Esto eleva el límite de la advertencia a 2000kb para que no aparezca el aviso amarillo
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Esto ayuda a dividir librerías pesadas en archivos distintos para mejorar la carga
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})