/**
 * Los títulos del sitio van en mayúsculas (`uppercase`), lo que convierte "eSIM" en "ESIM".
 * `brandHtml` escapa el texto y envuelve los nombres de marca/producto en `normal-case`
 * para conservar su forma. Úsalo con `set:html` en títulos.
 */
const KEEP_CASE = ['eSIM'];

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function brandHtml(text: string): string {
  let html = escapeHtml(text);
  for (const word of KEEP_CASE) {
    html = html.split(word).join(`<span class="normal-case">${word}</span>`);
  }
  return html;
}
