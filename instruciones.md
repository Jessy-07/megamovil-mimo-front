ROL
Eres un Senior Front-End Engineer y UI/UX designer especializado en sitios de conversión (e-commerce / telecom) con Astro + React + Tailwind. Tu objetivo: maquetar el HOME de "Mega móvil", la telefonía celular de Megacable (México), en un sitio 100% enfocado en VENDER planes de telefonía móvil.

ALCANCE
- SOLO FRONT-END. Sin backend, sin admin, sin APIs reales. Todo el contenido sale de archivos JSON locales en src/data/ para que después se conecte fácil a un back/admin.
- Entrega el Home completo, responsive (mobile-first), listo para producción visual.

STACK OBLIGATORIO
- Astro (output estático) + componentes React como "islas" SOLO donde haya interactividad (client:visible / client:load según el caso).
- Tailwind CSS con design tokens en tailwind.config (colores, tipografías, radios, sombras).
- TypeScript.
- Imágenes con astro:assets (WebP/AVIF, width/height definidos, lazy load; lee el archel hero con loading="eager" y fetchpriority="high").
- Iconos con lucide-react o SVG inline. Redes sociales como SVG.
- Sin librerías pesadas. Carruseles con Embla o CSS scroll-snap.

IDENTIDAD VISUAL (conservar la del sitio actual de Mega móvil)
- Azul profundo/eléctrico (fondos de cobertura, footer, textos de títulos), naranja vibrante (CTAs principales, badges "¡Para toda la familia!", "¡Llévate todo!", banner de recarga), blanco y grises muy claros (tarjetas).
- Logo: "La Telefonía Celular de MEGA" + logotipo "Mega móvil" en header.
- Header en forma de píldora naranja redondeada con menú: Consulta (dropdown), Cámbiate a Mega móvil, Promociones, eSIM, Ayuda (dropdown). Debe ser sticky.
- Tipografía: sans-serif redondeada y moderna, títulos en bold/black, precios MUY grandes.
- Bordes muy redondeados (16–28px), sombras suaves, mucho aire, jerarquía clara.
- Define los tokens: --mega-blue, --mega-orange, --mega-navy, --mega-gray, etc. y úsalos en todo el sitio. Toma los colores de las capturas del sitio actual.

REFERENCIAS DE ESTRUCTURA COMERCIAL (inspirarse, NO copiar)
- mibait.com: banner promocional grande de entrada con cintillo de urgencia y countdown, precios enormes en tarjetas de colores, "Recargar/Lo quiero" en cada tarjeta, badges de oferta destacada, tabs por categoría, botones flotantes de WhatsApp.
- diri.mx/mimovil: hero potente con ilustración/personajes, 3 beneficios clave bajo el hero, tarjetas de planes con GB gigantes, sección "Tú eliges cómo recargar", sección de app con mockup de teléfono, FAQ en acordeón con fondo oscuro/degradado, CTA de contacto.
Combina lo mejor de ambas con la identidad de Mega móvil.

ESTRUCTURA DEL HOME (en este orden exacto)
1. TOP BAR (cintillo) delgado en naranja con mensaje de promo + CTA corto ("¡Lo quiero!"). Opcional: contador regresivo (isla React) con fecha configurable en JSON. Botón de cerrar.
2. HEADER sticky tipo píldora (ver arriba) + selector de ubicación ("Chetumal" como placeholder) + botón "Cámbiate a Mega móvil" destacado.
3. HERO PROMOCIONAL (lo primero que ve el usuario): carrusel de 3 banners de promos (isla React, autoplay pausable, flechas, dots, swipe en móvil). Cada slide: titular enorme, subtítulo, precio/beneficio destacado, badge de vigencia, CTA naranja grande ("¡Lo quiero!") y espacio para imagen/persona del producto. Los banners salen de src/data/promos.json. Usa imágenes placeholder bien compuestas.
4. FRANJA DE 3-4 BENEFICIOS RÁPIDOS justo debajo del hero (íconos + texto corto): "Conserva tu número", "Redes sociales ilimitadas", "Cobertura nacional + EUA y Canadá", "Activa con eSIM".
5. PLANES (inmediatamente después, es el corazón de la página):
   - Tabs/switch grande: "Individuales" | "Familiares" (isla React). Por defecto: Individuales.
   - Individuales (3 tarjetas): Mega móvil Esencial 6GB $100/mes · Conectado 30GB $200/mes · Ilimitado "Datos ilimitados" $300/mes (el Ilimitado con badge "¡Llévate todo!" y borde naranja, tarjeta ligeramente más grande).
   - Familiares (3 tarjetas): 2 líneas $270 (1 línea de 30GB + 1 de 6GB) · 3 líneas $360 (1 de 30GB + 2 de 6GB) · 4 líneas $450 (1 de 30GB + 3 de 6GB, badge "¡Para toda la familia!" destacado). Texto "Conservando tu número".
   - Cada tarjeta: nombre, GB en tamaño gigante, "Redes sociales ilimitadas" con íconos (Facebook, X, Instagram, WhatsApp, Snapchat, Telegram, Messenger), "Minutos y SMS incluidos", "Por solo $XXX al mes" con precio enorme, nota legal pequeña con asterisco, botón naranja "¡Lo quiero!".
   - Hover con elevación y microanimación. Todo desde src/data/plans.json.
   - Debajo: texto "Todos los planes cuentan con redes sociales ilimitadas + minutos y SMS".
6. BANNER DE RECARGA: franja con borde azul, texto "¡Sigue conectado con más Gigas! Compra más saldo para tu Plan Mega móvil" + botón naranja "Quiero una recarga".
7. "TÚ ELIGES CÓMO CONTRATAR / RECARGAR": 3 tarjetas con ícono (En línea, App, Centros de atención CIS) con CTA cada una.
8. CÁMBIATE A MEGA MÓVIL EN 3 PASOS: Elige tu plan → Conserva tu número (portabilidad) o línea nueva → Activa con SIM o eSIM. Con CTA.
9. COMPATIBILIDAD DE TU EQUIPO: título "Consulta la compatibilidad de tu equipo", input para IMEI + botón "Validar aquí" (isla React, solo UI con validación de formato 15 dígitos y mensaje simulado). Junto a él, 3 pasos visuales para obtener el IMEI (marcar *#06#, desde configuración, impreso en etiqueta/caja). Link "Conoce los equipos compatibles".
10. COBERTURA: sección con fondo azul profundo, mapa de puntos decorativo con pines naranjas, 3 íconos (Cobertura nacional, Navega y llama en EE.UU. y Canadá "¡Sin costo adicional!", Tecnología y velocidad). Texto de apoyo con cobertura y soporte por WhatsApp. CTA "Consulta cobertura".
11. APP / eSIM: sección con mockup de teléfono y beneficios, botones App Store / Google Play (placeholders).
12. TESTIMONIOS: sección naranja "Cientos de Mega fans lo comentan ;)" con carrusel de testimonios (nombre + texto + avatar) desde src/data/testimonials.json.
13. FAQ en acordeón (isla React o <details> accesible): 8 preguntas (¿Puedo conservar mi número?, ¿Qué es una eSIM?, ¿Cómo recargo?, ¿Cómo consulto mi saldo?, ¿Qué cobertura tiene?, ¿Qué equipos son compatibles?, ¿Cómo cambio de plan?, ¿Cómo contacto a soporte?). Con respuestas placeholder realistas. Genera JSON-LD FAQPage.
14. CTA FINAL de cierre: "¿Listo para cambiarte a Mega móvil?" + botón grande.
15. FOOTER: logo, redes sociales, "Consultas y Soporte Técnico 33 9690 0000", "Localiza tu CIS más cercano", acordeones/listas de links legales (Ayuda, Cobertura Megamóvil, Legales, Código de prácticas comerciales, Contratos de adhesión prepago/pospago, Contrato de prestación de servicios, Garantías, CRT – Comisión Reguladora de Telecomunicaciones) y leyenda "Aplican restricciones. Consulta términos y condiciones aquí. Vigencia a mes calendario."
16. ELEMENTOS FLOTANTES: botón de WhatsApp fijo (esquina inferior derecha) y, en móvil, barra inferior sticky con CTA "¡Lo quiero!".

ENFOQUE DE CONVERSIÓN (CRÍTICO)
- Cada pantalla de scroll debe tener un CTA visible. Un solo color de CTA principal (naranja).
- Precios y GB siempre como lo más grande de cada tarjeta.
- Urgencia y escasez con moderación (contador, vigencias).
- Prueba social (testimonios), reducción de fricción (conserva tu número, sin cambiar chip con eSIM).
- Jerarquía: promo → planes → confianza → soporte.
- Primer viewport en móvil: ya deben verse la promo y el inicio de los planes.

SEO / AEO / PERFORMANCE
- HTML semántico (header, nav, main, section, article, footer), un solo h1, h2/h3 jerárquicos.
- Meta title/description, canonical, Open Graph, Twitter Cards en un Layout.astro reutilizable.
- JSON-LD: Organization, WebSite, Product/Offer por plan, FAQPage.
- Alt descriptivos, enlaces con texto claro, aria-labels, foco visible, contraste AA, navegación por teclado.
- Core Web Vitals: LCP < 2.5s, CLS ~ 0, JS mínimo (islas), fuentes con font-display: swap y preload, imágenes optimizadas.
- Generar sitemap.xml y robots.txt (@astrojs/sitemap).

ESTRUCTURA DE PROYECTO SUGERIDA
src/
  components/ (astro: Header, Hero, Benefits, Steps, Coverage, Footer… | react: PromoCarousel, PlanTabs, ImeiChecker, Faq, Countdown, Testimonials)
  data/ (plans.json, promos.json, testimonials.json, faq.json, nav.json, site.json)
  layouts/Layout.astro
  pages/index.astro
  styles/global.css
public/ (favicon, robots.txt)

REGLAS DE CÓDIGO
- Componentes pequeños, reutilizables, tipados, con props claras.
- Todo texto y dato comercial viene de /src/data (nada hardcodeado en componentes).
- Sin lógica de backend; los botones "¡Lo quiero!" apuntan a rutas placeholder (/contratar?plan=slug).
- Código limpio, comentado solo donde aporte. README breve con cómo correr (npm run dev / build).

ENTREGABLE
1. Proyecto Astro corriendo con el Home completo.
2. Resumen breve de decisiones de diseño y de dónde editar planes/promos.
3. Lista de pendientes para la fase back/admin.
Antes de escribir código, muéstrame en 10 líneas tu plan de componentes y paleta; luego procede.