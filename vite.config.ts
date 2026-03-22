import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

// Función para obtener dinámicamente todos los subdirectorios de alianzas
const getAlianzasInputs = () => {
  const alianzasDir = path.resolve(__dirname, 'alianzas');
  const inputs = { alianzas: path.resolve(__dirname, 'alianzas/index.html') };
  
  if (fs.existsSync(alianzasDir)) {
    const dirs = fs.readdirSync(alianzasDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
      
    dirs.forEach(dir => {
      const indexPath = path.resolve(__dirname, `alianzas/${dir}/index.html`);
      if (fs.existsSync(indexPath)) {
        inputs[`alianzas_${dir}`] = indexPath;
      }
    });
  }
  return inputs;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        input: {
          main:        path.resolve(__dirname, 'index.html'),
          calculadora: path.resolve(__dirname, 'calculadora.html'),
          aprobado:    path.resolve(__dirname, 'aprobado.html'),
          espera:      path.resolve(__dirname, 'espera.html'),
          ...getAlianzasInputs()
        },
      },
    },
  };
});
