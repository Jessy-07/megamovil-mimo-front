/**
 * INTERRUPTOR DE PUBLICACIÓN: el único valor que hay que cambiar el día que el sitio nuevo reemplace a megamovil.mx.
 *
 *  'pruebas'    → nadie debe indexarlo (el sitio actual está bien posicionado y no debe competir con una copia de prueba):
 *                 todas las páginas llevan <meta name="robots" content="noindex">, no se genera sitemap
 *                 y robots.txt no anuncia sitemap.
 *                 robots.txt NO bloquea el rastreo a propósito: si lo bloqueara, Google no vería el noindex
 *                 y podría indexar las URL sin contenido.
 *  'produccion' → se indexa: sin noindex, se genera sitemap-index.xml y robots.txt lo anuncia.
 *                 El dominio (site) pasa al real, así canonical, Open Graph, JSON-LD y sitemap salen con el dominio correcto.
 *
 * Lo usan astro.config.mjs (dominio y sitemap), layouts/Layout.astro (noindex) y pages/robots.txt.ts.
 */
export const MODO = 'pruebas'; // 'pruebas' | 'produccion'

export const DOMINIOS = {
  // Dominio de pruebas: se deja tal cual por decisión del usuario.
  pruebas: 'https://mimovil.megacable.com.mx',
  // Dominio real del sitio actual (responde sin www). [PENDIENTE: confirmar con sistemas el dominio final antes de publicar].
  produccion: 'https://megamovil.mx',
};

export const INDEXAR = MODO === 'produccion';
export const SITE = DOMINIOS[MODO];
