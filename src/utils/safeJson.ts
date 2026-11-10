/**
 * JSON para incrustar dentro de <script> (JSON-LD, datos de sucursales…).
 * JSON.stringify no escapa "<", así que un texto con "</script>" (por ejemplo, una respuesta de preguntas frecuentes
 * que en el futuro venga de un admin) cerraría la etiqueta y podría inyectar HTML. Se escapan <, > y & como \uXXXX:
 * sigue siendo el mismo JSON para el navegador y para Google.
 */
const ESCAPES: Record<string, string> = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' };

export function safeJson(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&]/g, (ch) => ESCAPES[ch]);
}
