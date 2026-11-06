/**
 * Lógica común de los formularios "¡Llámame!" conectados al Click to Call de Convertia / inConcert
 * (modal CallMeModal y franja CallStrip del Home).
 *
 * - Máscara mexicana (33) 1234-5678: lada de 2 dígitos entre paréntesis + 8 dígitos (10 en total).
 * - Valida 10 dígitos ANTES que Convertia (listener en fase de captura en document), para mostrar nuestro mensaje.
 * - Si Convertia ya conectó el formulario (atributo data-ic-form), deja seguir el envío: Convertia manda el número y
 *   muestra su aviso "¡¡Te llamaremos en breve!!".
 * - Si aún no conecta (sigue cargando), espera hasta 6 s y reintenta con el mismo botón (Convertia reporta su id).
 * - Si nunca conecta (bloqueador, sin red, dominio no autorizado): onFallback, para ofrecer WhatsApp con el número escrito.
 *
 * Requisito de Convertia: el formulario debe existir en el HTML al cargar la página y tener un input cuyo id o name
 * contenga "phone"/"telefono" (o data-ic-form-field="phone").
 */
export interface CallFormOptions {
  /** Número válido y Convertia conectado: el envío sigue su curso. */
  onSend?: () => void;
  /** Convertia no conectó: ofrecer WhatsApp. Recibe los 10 dígitos. */
  onFallback: (digits: string) => void;
  /** Mostrar u ocultar el mensaje de error (texto vacío = ocultar). */
  onError: (message: string) => void;
}

export const phoneDigits = (input: HTMLInputElement | null) => (input?.value ?? '').replace(/\D/g, '');

export function setupCallForm(form: HTMLFormElement, phone: HTMLInputElement, button: HTMLButtonElement | null, opts: CallFormOptions) {
  const buttonText = button?.textContent ?? '';
  const setSending = (sending: boolean) => {
    if (!button) return;
    button.disabled = sending;
    button.textContent = sending ? 'Enviando…' : buttonText;
  };
  const clearError = () => {
    phone.removeAttribute('aria-invalid');
    opts.onError('');
  };

  phone.addEventListener('input', () => {
    const d = phoneDigits(phone).slice(0, 10);
    phone.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
    clearError();
  });

  document.addEventListener(
    'submit',
    (e) => {
      if (e.target !== form) return;
      if (phoneDigits(phone).length !== 10) {
        e.preventDefault();
        e.stopImmediatePropagation();
        phone.setAttribute('aria-invalid', 'true');
        opts.onError('Escribe tu número a 10 dígitos.');
        phone.focus();
        return;
      }
      if (!form.hasAttribute('data-ic-form')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setSending(true);
        const started = Date.now();
        const wait = window.setInterval(() => {
          if (form.hasAttribute('data-ic-form')) {
            window.clearInterval(wait);
            setSending(false);
            button?.click();
          } else if (Date.now() - started > 6000) {
            window.clearInterval(wait);
            setSending(false);
            opts.onFallback(phoneDigits(phone));
          }
        }, 250);
        return;
      }
      opts.onSend?.();
    },
    true,
  );

  return { clearError };
}
