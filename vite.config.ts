
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge toutes les variables d'environnement (même celles sans VITE_)
  // Fix: Cast process to any to avoid TS error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Priorité : variable système (process.env) > variable .env (env)
  const apiKey = process.env.API_KEY || env.API_KEY || '';

  if (apiKey) {
    console.log("✅ API_KEY détectée et injectée dans l'application.");
  } else {
    console.warn("⚠️  ATTENTION : API_KEY introuvable. Les fonctions IA ne marcheront pas.");
  }
  
  return {
    plugins: [react()],
    define: {
      // Injection explicite de la clé API dans le code client
      'process.env.API_KEY': JSON.stringify(apiKey)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          // Important pour les websockets ou autres features, mais surtout pour éviter que le proxy ne cache certaines erreurs
          ws: true 
        }
      }
    }
  }
})