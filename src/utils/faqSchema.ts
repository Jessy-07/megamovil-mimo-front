/**
 * JSON-LD FAQPage a partir de faq-full.json. Convierte las respuestas "ricas"
 * (equipos, tabla comparativa, listas) en texto plano para Google.
 * Regla: cada pregunta se declara en UNA sola página (las de eSIM, solo en /esim).
 */
interface FaqLike {
  question: string;
  answer: string;
  devices?: { name: string; models: string[] }[];
  devicesNote?: string;
  comparison?: { headers: string[]; rows: string[][] };
  bullets?: string[];
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').trim();

export function faqAnswerText(item: FaqLike): string {
  const parts = [stripHtml(item.answer)];
  item.devices?.forEach((d) => parts.push(`${d.name}: ${d.models.join(', ')}.`));
  if (item.devicesNote) parts.push(item.devicesNote);
  if (item.comparison) {
    const [, a, b] = item.comparison.headers;
    item.comparison.rows.forEach(([k, x, y]) => parts.push(`${k}: ${a}, ${x}; ${b}, ${y}.`));
  }
  item.bullets?.forEach((b) => parts.push(b));
  return parts.filter(Boolean).join(' ');
}

export function faqPageSchema(items: FaqLike[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question.replace(/^\d+\.-\s*/, ''),
      acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(q) },
    })),
  };
}
