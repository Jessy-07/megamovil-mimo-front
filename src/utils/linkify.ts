/**
 * Convierte en enlaces las URL y el WhatsApp que vienen escritos dentro de un texto legal,
 * sin cambiar el texto visible. Escapa el HTML antes, así el texto nunca se interpreta como código.
 * - https://megamovil.mx/... → ruta del propio sitio (funciona en el dominio de pruebas y en el definitivo).
 * - Otros dominios → pestaña nueva con noopener.
 * - "33 9690 0001" → chat de WhatsApp.
 */
import site from '../data/site.json';

const LINK = 'font-bold text-mega-orange underline underline-offset-2 [overflow-wrap:anywhere] hover:text-mega-orange-dark';

// Enlaces del sitio anterior que en el sitio nuevo apuntan a otra dirección.
const INTERNAL_OVERRIDES: Record<string, string> = {
  '/terminos-y-condiciones': '#politica-de-uso-justo',
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function linkify(text: string): string {
  const html = escapeHtml(text).replace(/https?:\/\/[^\s]+/g, (raw) => {
    // El punto o la coma final pertenecen a la oración, no a la URL.
    const url = raw.replace(/[.,;:)]+$/, '');
    const tail = raw.slice(url.length);
    const own = url.match(/^https?:\/\/(?:www\.)?megamovil\.mx(\/[^\s]*)?$/);
    if (own) {
      const path = own[1] || '/';
      return `<a href="${INTERNAL_OVERRIDES[path] ?? path}" class="${LINK}">${url}</a>${tail}`;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${LINK}">${url}</a>${tail}`;
  });
  return html.replace(
    /33 9690 0001/g,
    `<a href="${site.whatsapp.href}" target="_blank" rel="noopener noreferrer" class="${LINK}">33 9690 0001</a>`,
  );
}
