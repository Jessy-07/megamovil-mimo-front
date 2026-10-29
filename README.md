# Mega móvil – Home (campaña "Mimo")

Home corto y enfocado en vender planes. Astro (estático) + React (4 islas) + Tailwind + TypeScript. Solo front-end: todo el contenido sale de `src/data/*.json`.

## Correr el proyecto

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera dist/ (incluye sitemap-index.xml)
npm run preview
```

## Dónde editar

| Qué | Dónde |
|---|---|
| Planes (precios, GB/líneas, badges, textos legales) | `src/data/plans.json` → `groups.family` y `groups.individual` (`highlight`, `badge`, `featured`, `mascot`) |
| Franja "Todos los planes incluyen" y pasos 1-2-3 | `src/data/plans.json` → `benefits`, `socialApps`, `steps` |
| Promos del hero y pose/precio de Mimo | `src/data/promos.json` → `mascot: { pose, priceLabel, priceNote }` |
| Barra superior, contador (fecha), menú, ciudades, footer | `src/data/nav.json` |
| Claim "Mimo no habla. Tu plan sí.", teléfono, WhatsApp, redes, textos de recarga/IMEI/cobertura/404 | `src/data/site.json` |
| FAQ (5 preguntas; `needsReview: true` = pendiente de validar) | `src/data/faq.json` |
| Colores, radios, sombras (tokens) | `tailwind.config.mjs` y variables `--mega-*` en `src/styles/global.css` |

## Mimo

- Poses en `src/assets/mimo/mimo-{price,point,box,phone,peek,head,sad}.*`. Hoy son **placeholders SVG**.
- Para reemplazarlos, sube tu PNG/WebP transparente con el **mismo nombre** (`mimo-price.webp`) y borra el `.svg`. Se prefiere `webp` > `png` > `svg`.
- Uso: `<Mimo pose="price|point|box|phone|peek|head|sad" size="sm|md|lg" />`.
- El precio del hero **no va en la imagen**: es texto HTML en `.mimo-sign`. Si el arte final cambia dónde queda el cartel, ajusta `--sign-left/top/w/h` en `global.css`.
- Animaciones solo con CSS (`mimo-float`, `mimo-wave`) y desactivadas con `prefers-reduced-motion`.
- `mimo-box.svg` está creada pero aún no se usa en el Home (queda disponible).

## Pendientes para back/admin

1. CMS/admin que escriba los JSON de `src/data/` (planes, promos con `mascot`, FAQ, nav/site).
2. Rutas reales: `/contratar?plan=slug`, `/recargar`, `/esim`, `/app`, `/cobertura`, `/equipos-compatibles`, páginas legales.
3. Validación real de IMEI y portabilidad (hoy el resultado es simulado).
4. Mapa de cobertura real (el de puntos es decorativo) y buscador de CIS.
5. Revisión legal de textos de FAQ y asteriscos de planes; fechas/vigencias de promos y contador.
6. Arte final de Mimo (7 poses), imagen Open Graph `public/og-image.png` (1200×630) y dominio final en `site` de `astro.config.mjs`.
7. Analítica, consentimiento de cookies y número/URL reales de WhatsApp.
