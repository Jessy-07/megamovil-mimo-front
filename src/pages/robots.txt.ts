/**
 * robots.txt según el interruptor de publicación (src/config/publicacion.mjs).
 * Reemplaza al antiguo public/robots.txt, que siempre anunciaba el sitemap.
 */
import type { APIRoute } from 'astro';
import { INDEXAR } from '../config/publicacion.mjs';

export const GET: APIRoute = ({ site }) => {
  const body = INDEXAR
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`
    : [
        '# Sitio en PRUEBAS: todas las páginas llevan <meta name="robots" content="noindex"> y no hay sitemap.',
        '# No se bloquea el rastreo a propósito: si se bloqueara, los buscadores no verían el noindex.',
        'User-agent: *',
        'Allow: /',
        '',
      ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
