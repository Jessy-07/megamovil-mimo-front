// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mimovil.megacable.com.mx',
  output: 'static',
  integrations: [react(), tailwind({ applyBaseStyles: false }), sitemap()],
  // Direcciones del sitio anterior que se conservan al migrar el dominio.
  // /vinculatulinea va impresa en el banner de registro de líneas: manda al portal de registro.
  redirects: {
    '/vinculatulinea': 'https://registro.megamovil.mx/vinculatulinea/',
    // /aviso (vinculación de línea) se cita en los términos y condiciones; en el sitio anterior ya mandaba al mismo portal.
    '/aviso': 'https://registro.megamovil.mx/vinculatulinea/',
  },
});
