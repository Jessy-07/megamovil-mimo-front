/**
 * Enlaces de WhatsApp con mensaje prellenado: el asesor recibe el contexto
 * y el cliente no tiene que escribir nada. Número único en site.json (33 9690 0001, solo WhatsApp).
 */
import site from '../data/site.json';

export function whatsappUrl(text?: string): string {
  return text ? `${site.whatsapp.href}?text=${encodeURIComponent(text)}` : site.whatsapp.href;
}

interface PlanLike {
  name: string;
  lines?: number;
  gigas?: string;
  highlight: { value: string; unit: string };
  price: number;
}

/** Descripción corta del plan para el mensaje: "Mega móvil Conectado (30 GB) de $200/mes". */
export function planSummary(plan: PlanLike): string {
  const detail =
    plan.lines && plan.lines > 1
      ? `${plan.lines} líneas`
      : plan.gigas === 'ILIMITADO' || plan.highlight.value === '∞'
        ? 'datos ilimitados'
        : `${plan.gigas ?? plan.highlight.value} GB`;
  return `${plan.name} (${detail}) de $${plan.price}/mes`;
}
