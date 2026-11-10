import { Globe2 } from 'lucide-react';

/** Paquetes de roaming internacional (adicionales al plan base). Los botones abren WhatsApp con el paquete ya escrito. */

interface Zone {
  id: string;
  name: string;
  summary: string;
}
interface Plan {
  zone: string;
  data: string;
  days: number;
  price: number;
  href: string;
}
interface Props {
  zones: Zone[];
  plans: Plan[];
  ctaLabel: string;
}

export default function RoamingPlans({ zones, plans, ctaLabel }: Props) {
  const zoneById = (id: string) => zones.find((z) => z.id === id)!;
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {plans.map((p) => {
        const z = zoneById(p.zone);
        // "500 MB" → 500 + MB (la unidad va en naranja, como "GB" en los planes del Home)
        const [, amount = p.data, unit = ''] = p.data.match(/^([\d.,]+)\s*(\S+)$/) ?? [];
        return (
          <li key={`${p.zone}-${p.data}`}>
            {/* Misma estructura que las tarjetas de planes del Home (PlanCard): borde fino sin sombra, datos grandes con
                la unidad en naranja, "Por solo" + precio y el botón naranja abajo. */}
            <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 text-mega-navy sm:p-7">
              <p className="flex items-center gap-2 font-display text-base font-extrabold uppercase tracking-wide">
                <Globe2 className="h-5 w-5 shrink-0 text-mega-orange" aria-hidden="true" />
                {z.name}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">{z.summary}</p>

              <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-display text-6xl font-extrabold leading-none tracking-tight">{amount}</span>
                <span className="font-display text-3xl font-extrabold text-mega-orange-dark">{unit}</span>
                <span className="whitespace-nowrap text-sm font-semibold text-slate-500">por {p.days} días</span>
              </p>

              <hr className="my-5 border-t border-slate-200" />

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Por solo</p>
              <p className="mt-0.5 flex items-start gap-0.5">
                <span className="mt-1.5 font-display text-2xl font-extrabold">$</span>
                <span className="font-display text-5xl font-extrabold leading-none tracking-tight">{p.price.toLocaleString('es-MX')}</span>
              </p>

              <div className="mt-auto pt-6">
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${ctaLabel} Paquete ${z.name} de ${p.data} por ${p.days} días`}
                  className="inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-full bg-mega-orange px-5 font-display text-[19px] font-extrabold text-white hover:bg-mega-orange-dark"
                >
                  {ctaLabel}
                </a>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
