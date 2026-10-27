import { defineConfig } from 'vite';

// En developpement (npm run dev), Vite joue le role de nginx : il relaie /api
// vers l'API lancee sur le poste.
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3000',
        rewrite: (chemin) => chemin.replace(/^\/api/, ''),
      },
    },
  },
});
