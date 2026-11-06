import { ArrowRight, Globe2 } from 'lucide-react';

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
        return (
          <li key={`${p.zone}-${p.data}`}>
            <article className="relative flex h-full flex-col rounded-3xl border-2 border-slate-200/90 bg-white p-6 text-center shadow-card-clean">
              <p className="flex items-center justify-center gap-2 font-display text-lg font-black uppercase tracking-wider text-mega-navy">
                <Globe2 className="h-5 w-5 text-mega-orange" aria-hidden="true" />
                {z.name}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{z.summary}</p>

              <div className="my-5 rounded-2xl bg-gradient-to-b from-slate-50/90 to-orange-50/20 py-5">
                <p className="font-display text-5xl font-black leading-none tracking-tight text-mega-navy">{p.data}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">por {p.days} días</p>
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Por solo</p>
              <p className="flex items-baseline justify-center gap-0.5 text-mega-navy">
                <span className="font-display text-2xl font-black text-slate-700">$</span>
                <span className="font-display text-5xl font-black leading-none tracking-tight">{p.price.toLocaleString('es-MX')}</span>
              </p>

              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-mega-orange hover:bg-mega-orange-dark px-4 py-3.5 font-display text-base font-black uppercase tracking-wider text-white shadow-orange-glow"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
