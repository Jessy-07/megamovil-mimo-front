/**
 * Resuelve las anclas de los componentes compartidos (Header, TopBar, barra fija móvil) según la página:
 * - `#planes`: en el Home y en /planes se queda como ancla (la sección está ahí); en el resto lleva a /planes.
 * - Cualquier otra ancla (`#promos`, `#compatibilidad`…): fuera del Home apunta al Home (`/#promos`).
 * - Rutas y URLs completas se dejan igual.
 */
const PAGES_WITH_PLANS = new Set(['/', '/planes']);

export function resolveAnchor(href: string, pathname: string): string {
  if (!href.startsWith('#')) return href;
  const path = pathname.replace(/\/$/, '') || '/';
  if (href === '#planes') return PAGES_WITH_PLANS.has(path) ? href : '/planes';
  return path === '/' ? href : `/${href}`;
}
