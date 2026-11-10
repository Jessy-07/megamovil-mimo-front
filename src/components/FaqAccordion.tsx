import { Fragment, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  CardSim,
  Check,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronRight,
  Globe2,
  Headphones,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  PlaneTakeoff,
  QrCode,
  Search,
  Smartphone,
  Store,
  Wallet,
  X,
} from 'lucide-react';

import { BRAND_LOGOS } from '../utils/brandLogos';

type IconType = ComponentType<{ className?: string }>;

interface Channel {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}
interface ContactGroup {
  title: string;
  channels: Channel[];
}
interface RecargaChannel {
  title: string;
  detail: string;
  desc: string;
  actionLabel: string;
  href: string;
  external?: boolean;
}
/**
 * Siguiente paso al final de una respuesta. Nunca debe repetir información que ya está en la respuesta:
 * - `accion`: ejecuta lo explicado (enviar SMS, marcar) o lleva a una guía más completa.
 * - `venta`: lleva a los planes.
 */
interface Cta {
  type: 'accion' | 'venta';
  label: string;
  href: string;
}
interface DeviceBrand {
  /** Clave en BRAND_LOGOS (apple, samsung, huawei, motorola…). */
  brand: string;
  name: string;
  models: string[];
}
interface Comparison {
  headers: [string, string, string];
  rows: [string, string, string][];
}
interface FaqItem {
  id: string;
  number: number;
  category: string;
  question: string;
  answer: string;
  hasCustomCards?: boolean;
  contactGroups?: ContactGroup[];
  hasRecargaGrid?: boolean;
  recargaChannels?: RecargaChannel[];
  /** Lista de equipos por marca, con buscador (eSIM). */
  devices?: DeviceBrand[];
  devicesNote?: string;
  /** Tabla comparativa de 3 columnas; la última se destaca (eSIM). */
  comparison?: Comparison;
  /** Listado de lugares (países…), se muestra agrupado por letra con filtro. El texto de `answer` se conserva para SEO. */
  countries?: string[];
  /** Lista con checks. */
  bullets?: string[];
  cta?: Cta;
}
interface Category {
  id: string;
  label: string;
}
interface Props {
  categories: Category[];
  items: FaqItem[];
  /**
   * `completo` (por defecto): buscador, categorías y grupos con título (página /preguntas-frecuentes).
   * `simple`: solo la lista de preguntas, para incrustarla en una página (p. ej. /esim).
   */
  variant?: 'completo' | 'simple';
  /** Oculta los CTA cuando la página ya ofrece esas acciones en otra sección (evita botones redundantes). */
  hideCtas?: boolean;
  /**
   * Franja de venta entre temas (solo con "Todas" y sin búsqueda). Aparece después de la categoría `afterCategory`;
   * si esa categoría no existe o no tiene preguntas, no se muestra. Se administra en faq-full.json → salesNudge.
   */
  salesNudge?: { afterCategory: string; title: string; text: string; cta: string; href: string };
}

/** Texto de ejemplo del buscador: el largo no cabe en celular. */
const PLACEHOLDER_LONG = '¿Qué necesitas? Ej. saldo, recargas, eSIM, portabilidad';
const PLACEHOLDER_SHORT = 'Busca: saldo, eSIM, recargas…';

const CATEGORY_ICONS: Record<string, IconType> = {
  todas: LayoutGrid,
  soporte: Headphones,
  planes: Wallet,
  sim: CardSim,
  esim: QrCode,
  roaming: PlaneTakeoff,
  cobertura: Globe2,
};

const WhatsAppIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

/** Minúsculas, sin acentos y sin etiquetas HTML, para buscar "saldo" = "Saldo" = "sáldo". */
const normalize = (text: string) =>
  text
    .replace(/<[^>]+>/g, ' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const cleanQuestion = (q: string) => q.replace(/^\d+\.-\s*/, '');

function channelIcon(ch: Channel): IconType {
  if (ch.href?.includes('wa.me')) return WhatsAppIcon;
  if (ch.href?.startsWith('mailto:')) return Mail;
  if (ch.href?.startsWith('tel:*')) return Smartphone;
  if (ch.href?.startsWith('tel:')) return Phone;
  return MapPin;
}

const RECARGA_ICONS: IconType[] = [Smartphone, Phone, MapPin, Store];

function BrandMark({ brand, className = 'h-5 w-5' }: { brand: string; className?: string }) {
  const logo = BRAND_LOGOS[brand];
  if (!logo) return null;
  return (
    <svg viewBox={logo.viewBox ?? '0 0 24 24'} fill="currentColor" className={className} style={{ color: logo.color }} aria-hidden="true">
      <path d={logo.path} />
    </svg>
  );
}

/** Buscador de equipos compatibles: filtra por marca o por texto ("13 pro", "s22"). */
function DeviceFinder({ devices, note }: { devices: DeviceBrand[]; note?: string }) {
  const [brand, setBrand] = useState<string>('todas');
  const [text, setText] = useState('');
  const t = normalize(text.trim());

  /* Si se reconoce la marca del celular del visitante, se preselecciona (menos scroll, menos clics). */
  useEffect(() => {
    const ua = navigator.userAgent;
    const detected = /iPhone|iPad|iPod/i.test(ua)
      ? 'apple'
      : /SM-|Samsung/i.test(ua)
        ? 'samsung'
        : /Huawei|HUAWEI/.test(ua)
          ? 'huawei'
          : /moto|Motorola/i.test(ua)
            ? 'motorola'
            : null;
    if (detected && devices.some((d) => d.brand === detected)) setBrand(detected);
  }, [devices]);

  const visible = devices
    .filter((d) => t || brand === 'todas' || d.brand === brand)
    .map((d) => ({ ...d, models: d.models.filter((m) => !t || normalize(`${d.name} ${m}`).includes(t)) }))
    .filter((d) => d.models.length > 0);

  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 sm:p-5">
      <label className="relative block">
        <span className="sr-only">Busca tu modelo</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mega-orange" aria-hidden="true" />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Busca tu modelo. Ej. iPhone 13, S22"
          autoComplete="off"
          className="h-12 w-full rounded-full border-2 border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-mega-navy placeholder:font-medium placeholder:text-slate-400 focus:border-mega-orange focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      {/* Marcas con su logo oficial */}
      <div role="radiogroup" aria-label="Marca" className={`no-scrollbar mt-3 flex gap-2 overflow-x-auto ${t ? 'opacity-50' : ''}`}>
        {[{ brand: 'todas', name: 'Todas' }, ...devices].map((d) => {
          const active = !t && brand === d.brand;
          const logo = BRAND_LOGOS[d.brand];
          return (
            <button
              key={d.brand}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={d.name}
              onClick={() => {
                setText('');
                setBrand(d.brand);
              }}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border-2 bg-white px-4 font-display text-xs sm:text-sm font-black cursor-pointer select-none ${
                active ? 'border-mega-orange text-mega-orange' : 'border-slate-200 text-slate-600 hover:border-mega-orange/40'
              }`}
            >
              {logo && <BrandMark brand={d.brand} className={logo.wordmark ? 'h-3 w-auto' : 'h-4 w-4'} />}
              {!logo?.wordmark && <span>{d.name}</span>}
            </button>
          );
        })}
      </div>

      {/* Modelos */}
      <div className="mt-4 space-y-4" aria-live="polite">
        {visible.map((d) => (
          <div key={d.brand}>
            <p className="mb-2 flex items-center gap-2 font-display text-xs font-black uppercase tracking-wider text-slate-500">
              <BrandMark brand={d.brand} className={BRAND_LOGOS[d.brand]?.wordmark ? 'h-2.5 w-auto' : 'h-3.5 w-3.5'} />
              {!BRAND_LOGOS[d.brand]?.wordmark && d.name}
            </p>
            <ul className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3">
              {d.models.map((m) => (
                <li key={m} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-mega-navy">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="rounded-xl bg-white p-4 text-center">
            <p className="text-sm font-bold text-mega-navy">No encontramos “{text.trim()}” en la lista.</p>
            <a href="tel:*%2306%23" className="mt-3 inline-flex items-center gap-2 rounded-full bg-mega-navy px-5 py-2.5 font-display text-xs font-black text-white hover:bg-mega-orange">
              <Phone className="h-4 w-4" aria-hidden="true" /> Marcar *#06# y buscar el EID
            </a>
          </div>
        )}
      </div>

      {note && visible.length > 0 && (
        <p className="mt-4 flex items-start gap-2 text-xs sm:text-sm font-semibold text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-mega-orange" aria-hidden="true" />
          {note}
        </p>
      )}
    </div>
  );
}

/** Listado de países: etiquetas agrupadas por letra inicial; con filtro si es larga (más de 20). */
function CountryList({ countries }: { countries: string[] }) {
  const [text, setText] = useState('');
  const t = normalize(text.trim());
  const sorted = useMemo(() => [...countries].sort((a, b) => a.localeCompare(b, 'es')), [countries]);
  const shown = sorted.filter((c) => !t || normalize(c).includes(t));
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    shown.forEach((c) => {
      const letter = normalize(c).charAt(0).toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), c]);
    });
    return [...map.entries()];
  }, [shown]);

  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-display text-sm font-black text-mega-navy">
          <Globe2 className="h-4 w-4 text-mega-orange" aria-hidden="true" />
          {t ? `${shown.length} de ${countries.length} países` : `${countries.length} países`}
        </p>
        {countries.length > 20 && (
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Buscar país</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mega-orange" aria-hidden="true" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Buscar país"
              autoComplete="off"
              className="h-10 w-full rounded-full border-2 border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-mega-navy placeholder:font-medium placeholder:text-slate-400 focus:border-mega-orange focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
        )}
      </div>

      <div className="mt-4 space-y-3" aria-live="polite">
        {groups.map(([letter, list]) => (
          <div key={letter} className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mega-navy font-display text-sm font-black text-white" aria-hidden="true">
              {letter}
            </span>
            <ul className="flex flex-wrap gap-1.5 pt-0.5">
              {list.map((c) => (
                <li key={c} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-mega-navy shadow-sm ring-1 ring-slate-200/80">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.length === 0 && <p className="rounded-xl bg-white p-4 text-center text-sm font-bold text-slate-500">No encontramos “{text.trim()}” en esta lista.</p>}
      </div>
    </div>
  );
}

/** Tabla comparativa; la última columna (eSIM) se destaca en naranja. */
function ComparisonTable({ data }: { data: Comparison }) {
  const [label, a, b] = data.headers;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      <table className="w-full table-fixed text-left text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-50 font-display font-black uppercase tracking-wider">
            <th scope="col" className="px-3 py-3 sm:px-4 text-slate-500">{label}</th>
            <th scope="col" className="px-3 py-3 sm:px-4 text-mega-navy">{a}</th>
            <th scope="col" className="bg-orange-50 px-3 py-3 sm:px-4 text-mega-orange">
              {/* "eSIM" conserva su forma dentro del encabezado en mayúsculas */}
              <span className={b === 'eSIM' ? 'normal-case' : undefined}>{b}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.rows.map(([k, x, y]) => (
            <tr key={k}>
              <th scope="row" className="px-3 py-3 sm:px-4 font-bold text-slate-500">{k}</th>
              <td className="px-3 py-3 sm:px-4 font-semibold text-slate-600">{x}</td>
              <td className="bg-orange-50/60 px-3 py-3 sm:px-4 font-black text-mega-navy">{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FaqAccordion({ categories, items, variant = 'completo', hideCtas = false, salesNudge }: Props) {
  const simple = variant === 'simple';
  const [activeCategory, setActiveCategory] = useState('todas');
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_LONG);

  /* Temas fijos al hacer scroll: se pegan justo debajo del header sticky (su alto cambia entre celular y escritorio). */
  const [stickyTop, setStickyTop] = useState(0);
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setPlaceholder(mq.matches ? PLACEHOLDER_SHORT : PLACEHOLDER_LONG);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (simple) return;
    const header = document.getElementById('sticky-header-container');
    if (!header) return;
    const measure = () => setStickyTop(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, [simple]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (simple || !el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < stickyTop + 1), {
      rootMargin: `-${Math.round(stickyTop)}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [simple, stickyTop]);

  /* Al cambiar de tema con la barra pegada, regresa al inicio de la lista (si no, el usuario queda a media página). */
  const backToListTop = () => {
    const el = sentinelRef.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - stickyTop;
    if (window.scrollY > y) window.scrollTo({ top: y });
  };

  /* Enlace directo a una pregunta (/preguntas-frecuentes#faq-9): la abre y la muestra. */
  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (!items.some((i) => i.id === id)) return;
    setOpenIds(new Set([id]));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }, [items]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        history.replaceState(null, '', `#${id}`);
      }
      return next;
    });
  };

  const q = normalize(query.trim());
  const searching = q.length > 0;

  /* Índice de búsqueda: pregunta + respuesta + canales, ya normalizados. */
  const index = useMemo(
    () =>
      Object.fromEntries(
        items.map((i) => [
          i.id,
          normalize(
            [
              i.question,
              i.answer,
              ...(i.contactGroups?.flatMap((g) => g.channels.map((c) => `${c.label} ${c.value}`)) ?? []),
              ...(i.recargaChannels?.map((r) => `${r.title} ${r.detail} ${r.desc}`) ?? []),
              ...(i.devices?.flatMap((d) => [d.name, ...d.models]) ?? []),
              ...(i.comparison?.rows.flat() ?? []),
              ...(i.bullets ?? []),
            ].join(' '),
          ),
        ]),
      ),
    [items],
  );

  /* Visible = coincide con la búsqueda (en todas las categorías) o con la categoría elegida. */
  const isVisible = (i: FaqItem) => (searching ? index[i.id].includes(q) : activeCategory === 'todas' || i.category === activeCategory);
  const visibleCount = items.filter(isVisible).length;

  /* Grupos por categoría, en el orden del selector. */
  const groups = categories
    .filter((c) => c.id !== 'todas')
    .map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="w-full">
      {/* ============================== BUSCADOR ============================== */}
      <div hidden={simple} className="rounded-3xl bg-white p-3 sm:p-4 shadow-card-clean">
        <label htmlFor="faq-search" className="sr-only">
          Buscar en preguntas frecuentes
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-mega-orange" aria-hidden="true" />
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className="h-14 w-full rounded-full border-2 border-slate-200 bg-slate-50 pl-14 pr-12 text-base font-semibold text-mega-navy placeholder:font-medium placeholder:text-slate-400 focus:border-mega-orange focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-slate-200 text-slate-600 hover:bg-mega-orange hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

      </div>

      {/* ===================== TEMAS (fijos debajo del menú al hacer scroll) ===================== */}
      <div ref={sentinelRef} hidden={simple} aria-hidden="true" />
      <div
        hidden={simple}
        style={{ top: stickyTop }}
        className={`sticky z-30 -mx-3 mt-3 px-3 py-2.5 sm:-mx-4 sm:px-4 ${stuck ? 'border-b border-slate-200 bg-white/95 backdrop-blur-md' : ''}`}
      >
          {/* Categorías: en móvil se deslizan horizontalmente, con desvanecido a la derecha para indicar que hay más */}
          <div
            role="radiogroup"
            aria-label="Filtrar por tema"
            className={`no-scrollbar flex gap-1.5 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:flex-wrap sm:justify-center sm:overflow-visible sm:pr-0 sm:[mask-image:none] ${searching ? 'opacity-50' : ''}`}
          >
            {categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.id] ?? LayoutGrid;
              const active = !searching && activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setQuery('');
                    setActiveCategory(c.id);
                    if (stuck) backToListTop();
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-2 font-display text-xs sm:text-sm font-black cursor-pointer select-none ${
                    active ? 'border-mega-orange bg-orange-50 text-mega-orange' : 'border-slate-200 bg-white text-slate-600 hover:border-mega-orange/40 hover:text-mega-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
      </div>

      {/* Resumen de la búsqueda */}
      <p hidden={simple} className="mt-6 px-1 text-sm font-semibold text-slate-500" role="status" aria-live="polite">
        {searching &&
          (visibleCount > 0 ? (
            <>
              {visibleCount} {visibleCount === 1 ? 'resultado' : 'resultados'} para <strong className="text-mega-navy">“{query.trim()}”</strong>
            </>
          ) : (
            ''
          ))}
      </p>

      {/* ============================ SIN RESULTADOS ============================ */}
      {searching && visibleCount === 0 && (
        <div className="mt-2 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-mega-orange">
            <LifeBuoy className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl font-black text-mega-navy">No encontramos “{query.trim()}”</h3>
          {/* El contacto (WhatsApp / llamada) está justo debajo en "¿No encontraste tu respuesta?": no se repite aquí. */}
          <p className="mt-1 text-sm font-medium text-slate-500">Prueba con otra palabra o pregúntanos directo aquí abajo.</p>
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setQuery('')}
              className="inline-flex items-center justify-center rounded-full border-2 border-slate-200 px-6 py-3 font-display text-sm font-extrabold text-mega-navy hover:border-mega-orange hover:text-mega-orange cursor-pointer"
            >
              Ver todas
            </button>
          </div>
        </div>
      )}

      {/* ====================== PREGUNTAS AGRUPADAS POR TEMA ======================
          Todas las respuestas se generan en el HTML (SEO); las cerradas usan `hidden`. */}
      <div className="space-y-10">
        {groups.map((g) => {
          const groupVisible = g.items.some(isVisible);
          const Icon = CATEGORY_ICONS[g.id] ?? LayoutGrid;
          const showNudge = !!salesNudge && !simple && !searching && activeCategory === 'todas' && g.id === salesNudge.afterCategory;
          return (
            <Fragment key={g.id}>
            <section hidden={!groupVisible} aria-labelledby={simple ? undefined : `grupo-${g.id}`}>
              {!simple && (
                <h2 id={`grupo-${g.id}`} className="mb-3 flex items-center gap-2.5 px-1 font-display text-lg sm:text-xl font-black uppercase tracking-tight text-mega-navy">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-mega-navy text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  {/* "eSIM" conserva su forma dentro del título en mayúsculas */}
                  <span className={g.label === 'eSIM' ? 'normal-case' : undefined}>{g.label}</span>
                </h2>
              )}

              {/* Lista plana con divisores: mismo estilo que las preguntas del Home (Faq.tsx). */}
              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {g.items.map((item) => {
                  const open = openIds.has(item.id);
                  return (
                    <li
                      key={item.id}
                      id={item.id}
                      hidden={!isVisible(item)}
                      className={simple ? 'scroll-mt-36' : 'scroll-mt-48'}
                    >
                      <h3>
                        <button
                          type="button"
                          id={`${item.id}-q`}
                          aria-expanded={open}
                          aria-controls={`${item.id}-a`}
                          onClick={() => toggle(item.id)}
                          className="group flex w-full items-center justify-between gap-4 py-4 sm:py-5 text-left cursor-pointer"
                        >
                          <span className={`font-display text-base sm:text-lg font-black leading-snug group-hover:text-mega-orange ${open ? 'text-mega-orange' : 'text-mega-navy'}`}>
                            {cleanQuestion(item.question)}
                          </span>
                          <span
                            className={`grid h-8 w-8 shrink-0 place-items-center ${open ? 'rotate-180 text-mega-orange' : 'text-slate-400 group-hover:text-mega-orange'}`}
                            aria-hidden="true"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </span>
                        </button>
                      </h3>

                      <div id={`${item.id}-a`} role="region" aria-labelledby={`${item.id}-q`} hidden={!open} className="max-w-4xl pb-6">
                        {item.answer && !item.countries && (
                          <div className="text-sm sm:text-base font-medium leading-relaxed text-slate-600" dangerouslySetInnerHTML={{ __html: item.answer }} />
                        )}

                        {/* Equipos compatibles con buscador (eSIM) */}
                        {item.devices && <DeviceFinder devices={item.devices} note={item.devicesNote} />}

                        {/* Listado de países (roaming) */}
                        {item.countries && <CountryList countries={item.countries} />}

                        {/* Tabla comparativa (eSIM vs SIM física) */}
                        {item.comparison && <ComparisonTable data={item.comparison} />}

                        {/* Lista con checks (beneficios) */}
                        {item.bullets && (
                          <ul className="mt-4 space-y-2.5">
                            {item.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-3 text-sm sm:text-base font-medium text-slate-600">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-mega-orange" aria-hidden="true" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Canales de contacto (pregunta 1) */}
                        {item.contactGroups && (
                          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {item.contactGroups.map((group) => (
                              <div key={group.title} className="rounded-2xl bg-slate-50 p-4">
                                <p className="mb-1 font-display text-xs font-black uppercase tracking-wider text-mega-orange">{group.title}</p>
                                <ul className="divide-y divide-slate-200/70">
                                  {group.channels.map((ch) => {
                                    const ChIcon = channelIcon(ch);
                                    return (
                                      <li key={ch.label + ch.value}>
                                        <a
                                          href={ch.href}
                                          {...(ch.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                          className="group/ch flex items-center gap-3 py-2.5"
                                        >
                                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-mega-orange">
                                            <ChIcon className="h-4 w-4" />
                                          </span>
                                          <span className="min-w-0 flex-1">
                                            <span className="block text-xs font-bold text-slate-500">{ch.label.replace(/:$/, '')}</span>
                                            <span className="block truncate text-sm font-black text-mega-navy group-hover/ch:text-mega-orange">{ch.value}</span>
                                          </span>
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Canales de recarga (pregunta 8) */}
                        {item.recargaChannels && (
                          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {item.recargaChannels.map((r, idx) => {
                              const RIcon = RECARGA_ICONS[idx] ?? Store;
                              return (
                                <li key={r.title}>
                                  <a
                                    href={r.href}
                                    {...(r.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    className="group/r flex h-full items-center gap-3 rounded-2xl bg-slate-50 p-4 hover:bg-orange-50"
                                  >
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-mega-orange">
                                      <RIcon className="h-5 w-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block font-display text-sm font-black text-mega-navy">{r.title}</span>
                                      <span className="block text-xs font-medium text-slate-500">
                                        <strong className="text-mega-navy">{r.detail}</strong> · {r.desc}
                                      </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover/r:text-mega-orange" aria-hidden="true" />
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {/* Siguiente paso: guía de soporte o venta */}
                        {item.cta && !hideCtas && (
                          <a
                            href={item.cta.href}
                            className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold ${
                              item.cta.type === 'venta'
                                ? 'bg-mega-orange hover:bg-mega-orange-dark text-white'
                                : 'bg-mega-navy text-white hover:bg-mega-orange'
                            }`}
                          >
                            {item.cta.label}
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Venta a media página: la lista es larga y el banner comercial queda hasta el final. */}
            {showNudge && salesNudge && (
              <aside aria-label="Planes Mega móvil" className="flex flex-col gap-3 rounded-2xl bg-orange-50 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                <p className="flex-1">
                  <span className="block font-display text-base font-black text-mega-navy">{salesNudge.title}</span>
                  <span className="block text-sm font-medium text-slate-600">{salesNudge.text}</span>
                </p>
                <a
                  href={salesNudge.href}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-mega-orange px-6 py-3 font-display text-sm font-extrabold text-white hover:bg-mega-orange-dark"
                >
                  {salesNudge.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </aside>
            )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
