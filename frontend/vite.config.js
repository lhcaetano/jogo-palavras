import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Escuta em todas as interfaces para permitir acesso pelo
    // navegador do Windows quando rodando dentro do WSL/Docker.
    host: '0.0.0.0',
    port: 5173,
    // Polling ajuda o hot reload a funcionar de forma estavel em
    // Docker sobre WSL.
    watch: {
      usePolling: true,
    },
  },
});
