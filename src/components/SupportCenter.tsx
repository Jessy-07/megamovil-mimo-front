import { useEffect, useId, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';

type IconType = ComponentType<{ className?: string }>;
import {
  ArrowRight,
  CardSim,
  ChevronRight,
  Clock3,
  Globe2,
  Info,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Play,
  QrCode,
  Radio,
  Send,
  Settings,
  Smartphone,
  Unlock,
  Wallet,
  Wifi,
} from 'lucide-react';
import ImeiChecker from './ImeiChecker';

/* ------------------------------------------------------------------ */
/* Datos de contacto (fuente única para esta sección)                 */
/* ------------------------------------------------------------------ */
const CONTACT = {
  phone: { label: '33 9690 0000', href: 'tel:3396900000' },
  short: { label: '*1234', href: 'tel:*1234' },
  whatsapp: { label: '33 9690 0001', href: 'https://wa.me/523396900001' },
  email: { label: 'atencionclientes@megacable.com.mx', href: 'mailto:atencionclientes@megacable.com.mx' },
  cis: { href: 'https://megacable.com.mx/cis' },
};

/* ------------------------------------------------------------------ */
/* Videos de tutoriales de desbloqueo (del sitio actual).             */
/* Versión web en /public/assets/video/ (720p, ~1.5 MB, con portada).  */
/* Los originales 1080p están en src/assets/video/desbloqueo_*.mp4.    */
/* Si `src` queda vacío se muestra "Video disponible próximamente".    */
/* ------------------------------------------------------------------ */
type CarrierKey = 'telcel' | 'movistar' | 'att';
const TUTORIAL_VIDEOS: Record<CarrierKey, { src: string; poster: string }> = {
  telcel: { src: '/assets/video/desbloqueo-telcel.mp4', poster: '/assets/video/desbloqueo-telcel-poster.jpg' },
  movistar: { src: '/assets/video/desbloqueo-movistar.mp4', poster: '/assets/video/desbloqueo-movistar-poster.jpg' },
  att: { src: '/assets/video/desbloqueo-att.mp4', poster: '/assets/video/desbloqueo-att-poster.jpg' },
};
const CARRIERS: { key: CarrierKey; name: string }[] = [
  { key: 'telcel', name: 'Telcel' },
  { key: 'movistar', name: 'Movistar' },
  { key: 'att', name: 'AT&T' },
];

const WhatsAppIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Temas. El `key` también es el ancla de la URL (/soporte#saldo).    */
/* ------------------------------------------------------------------ */
type TabKey = 'activacion' | 'configuracion' | 'atencion' | 'saldo' | 'desbloqueo';

/* Mismo orden que el sitio actual (megamovil.mx/soporte). "Buzón de voz" se quitó del sitio actual y de aquí. */
const TABS: { key: TabKey; label: string; icon: IconType }[] = [
  { key: 'activacion', label: 'Activa tu línea', icon: Radio },
  { key: 'configuracion', label: 'Configura tu equipo', icon: Settings },
  { key: 'atencion', label: 'Atención a clientes', icon: Headphones },
  { key: 'saldo', label: 'Consulta tu saldo', icon: Wallet },
  { key: 'desbloqueo', label: 'Desbloquea tu celular', icon: Unlock },
];

/* Anclas cortas → oficiales, por si alguien comparte un enlace abreviado */
const HASH_ALIASES: Record<string, TabKey> = { desbloquea: 'desbloqueo', activa: 'activacion', configura: 'configuracion' };

/* ------------------------------------------------------------------ */
/* Configura tu equipo (contenido del sitio actual)                    */
/* ------------------------------------------------------------------ */
type OsKey = 'android' | 'iphone';
type ConfigStep = { title: string; note?: string; items: ReactNode[] };

/** Nombre de un menú del celular, como etiqueta. */
const Menu = ({ children }: { children: ReactNode }) => (
  <span className="whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-1.5 font-bold text-mega-navy">{children}</span>
);

/** Datos que el usuario debe capturar: dato arriba, valor abajo. */
const DataGrid = ({ rows }: { rows: [string, string][] }) => (
  <dl className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
    {rows.map(([k, v]) => (
      <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <dt className="text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-500">{k}</dt>
        <dd className="mt-0.5 break-words font-mono text-sm font-bold text-mega-navy">{v}</dd>
      </div>
    ))}
  </dl>
);

const CONFIG_STEPS: Record<OsKey, ConfigStep[]> = {
  android: [
    {
      title: 'Activa VoLTE',
      items: [
        <>Ingresa a <Menu>Configuración</Menu> o <Menu>Ajustes</Menu>.</>,
        <>Selecciona <Menu>Redes móviles</Menu> o <Menu>Conexiones</Menu>.</>,
        <>Ingresa a <Menu>Datos móviles</Menu> o <Menu>Redes móviles</Menu>.</>,
        <>Localiza la opción <Menu>VoLTE</Menu> o <Menu>Llamadas 4G</Menu>.</>,
        <strong className="text-mega-navy">Activa la función.</strong>,
      ],
    },
    {
      title: 'Configura el APN',
      items: [
        <>En <Menu>Datos móviles</Menu> o <Menu>Redes móviles</Menu>.</>,
        <>Selecciona <Menu>Nombres de punto de acceso</Menu> o <Menu>APN</Menu>.</>,
        <>Selecciona <Menu>Agregar APN</Menu> o crea uno nuevo.</>,
        <>
          Captura la siguiente información:
          <DataGrid rows={[['Nombre', 'Internet Mega móvil'], ['APN', 'mega45g']]} />
        </>,
        <strong className="text-mega-navy">Guarda la configuración.</strong>,
        <><strong className="text-mega-navy">Selecciona el APN</strong> que acabas de crear.</>,
      ],
    },
    {
      title: 'Valida el IMS',
      note: 'En la mayoría de los equipos esta configuración ya se encuentra registrada.',
      items: [
        <>En <Menu>Datos móviles</Menu> o <Menu>Redes móviles</Menu>.</>,
        <>Selecciona <Menu>Nombres de punto de acceso</Menu> o <Menu>APN</Menu>.</>,
        <>Selecciona <Menu>Agregar APN</Menu> o crea uno nuevo.</>,
        <>
          Captura la siguiente información:
          <DataGrid
            rows={[
              ['Nombre', 'IMS'],
              ['APN', 'ims'],
              ['MCC', '334'],
              ['MNC', '140'],
              ['Tipo de autenticación', 'PAP'],
              ['Tipo de APN', 'ims'],
              ['Protocolo APN', 'IPv4/IPv6'],
              ['Protocolo de roaming o itinerancia APN', 'IPv4/IPv6'],
            ]}
          />
        </>,
        <strong className="text-mega-navy">Guarda la configuración.</strong>,
        <strong className="text-mega-navy">Reinicia el equipo.</strong>,
      ],
    },
  ],
  iphone: [
    {
      title: 'Selección de red',
      items: [
        <>Ingresa a <Menu>Configuración</Menu>.</>,
        <>Selecciona <Menu>Red de datos celulares</Menu>.</>,
        <><strong className="text-mega-navy">Desactiva Automática</strong> y/o <strong className="text-mega-navy">Deshabilita opción del operador</strong>.</>,
        <>Selecciona la red <Menu>mega45g</Menu>.</>,
      ],
    },
    {
      title: 'Configura VoLTE',
      items: [
        <>En <Menu>Red celular</Menu>.</>,
        <>Selecciona <Menu>Opciones</Menu>.</>,
        <>Activa <Menu>Voz y datos en 4G</Menu>.</>,
        <>La opción <strong className="text-mega-navy">VoLTE debe estar activa</strong>.</>,
      ],
    },
    {
      title: 'Configura el APN',
      items: [
        <>En <Menu>Red celular</Menu>.</>,
        <>Ingresa a <Menu>Red de datos celulares</Menu>.</>,
        <strong className="text-mega-navy">Localiza los campos de APN.</strong>,
        <>
          <strong className="text-mega-navy">Captura</strong>:
          <DataGrid rows={[['APN', 'mega45g.com']]} />
        </>,
        <>Verifica la información.</>,
        <><strong className="text-mega-navy">Reinicia el equipo</strong> para aplicar los cambios.</>,
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                               */
/* ------------------------------------------------------------------ */
function PanelTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-mega-navy">{title}</h2>
      <p className="mt-2 text-sm sm:text-base font-medium text-slate-500">{text}</p>
    </div>
  );
}

const KEEP_CASE = ['eSIM', 'iPhone'];

/** Interruptor segmentado (mismo estilo que el switch de planes del Home). */
function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: IconType }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="mx-auto flex w-full max-w-sm rounded-full bg-slate-100 p-1">
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 font-display text-xs sm:text-sm font-black uppercase tracking-wider transition-colors cursor-pointer select-none ${
              active ? 'bg-white text-mega-orange shadow-sm' : 'text-slate-500 hover:text-mega-navy'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {/* "eSIM" e "iPhone" conservan su forma dentro del switch en mayúsculas */}
            <span className={KEEP_CASE.includes(o.label) ? 'normal-case' : undefined}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Marco de celular para ilustrar la acción (SMS, marcación). */
function PhoneMock({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[240px] rounded-[2.25rem] bg-mega-navy p-2 shadow-2xl" aria-hidden="true">
      <div className="relative flex aspect-[9/14] flex-col overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-mega-blue-electric to-mega-blue">
        <span className="mx-auto mt-2.5 h-4 w-16 rounded-full bg-mega-navy" />
        {children}
      </div>
    </div>
  );
}

/** Botón principal de cada tema. */
function ActionButton({ href, icon: Icon, children, external = false, tone = 'navy' }: {
  href: string;
  icon: IconType;
  children: ReactNode;
  external?: boolean;
  tone?: 'navy' | 'whatsapp';
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex w-full sm:w-auto items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-6 sm:px-8 py-3.5 font-display text-base font-extrabold text-white ${
        tone === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#20ba5a]' : 'bg-mega-navy hover:bg-mega-orange'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}

/** Franja comercial al final de cada tema: siempre de vuelta a la venta. */
function SalesNudge({ icon: Icon, title, cta, href = '/planes' }: { icon: IconType; title: string; cta: string; href?: string }) {
  return (
    <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl bg-orange-50 px-5 py-4">
      <span className="hidden sm:grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mega-orange text-white">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="flex-1 font-display text-base font-black text-mega-navy">{title}</p>
      <a href={href} className="inline-flex shrink-0 items-center gap-1.5 font-display text-base font-extrabold text-mega-orange hover:underline underline-offset-4">
        {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */
interface Props {
  /** Imagen optimizada de Mimo (la genera Astro y la pasa como URL). */
  mimoSrc?: string;
}

export default function SupportCenter({ mimoSrc }: Props) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<TabKey>('activacion');
  const [simType, setSimType] = useState<'sim' | 'esim'>('sim');
  const [os, setOs] = useState<OsKey>('android');
  const [carrier, setCarrier] = useState<CarrierKey>('telcel');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelTopRef = useRef<HTMLDivElement>(null);

  /* Abre la pestaña indicada en el ancla (#saldo, #activacion…) para enlaces directos. */
  useEffect(() => {
    const fromHash = () => {
      const raw = decodeURIComponent(window.location.hash.replace('#', ''));
      const key = (HASH_ALIASES[raw] ?? raw) as TabKey;
      if (TABS.some((t) => t.key === key)) setActiveTab(key);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    history.replaceState(null, '', `#${key}`);
    // En móvil el panel queda debajo del selector: lo acercamos (sin animación).
    if (window.matchMedia('(max-width: 767px)').matches) panelTopRef.current?.scrollIntoView({ block: 'start' });
  };

  /* Al cambiar de compañía o de tema, pausa el video que quedó oculto (si no, se sigue oyendo). */
  useEffect(() => {
    panelTopRef.current?.querySelectorAll<HTMLVideoElement>('video[data-carrier]').forEach((v) => {
      if (activeTab !== 'desbloqueo' || v.dataset.carrier !== carrier) v.pause();
    });
  }, [carrier, activeTab]);

  /* Navegación con flechas entre pestañas (patrón WAI-ARIA Tabs). */
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = TABS.length - 1;
    const map: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = map[e.key];
    setActiveTab(TABS[next].key);
    history.replaceState(null, '', `#${TABS[next].key}`);
    tabRefs.current[next]?.focus();
  };

  const tabId = (k: TabKey) => `${baseId}-tab-${k}`;
  const panelId = (k: TabKey) => `${baseId}-panel-${k}`;
  // Todos los paneles se generan en el HTML (SEO); solo se muestra el activo.
  const panelProps = (k: TabKey) => ({
    id: panelId(k),
    role: 'tabpanel' as const,
    'aria-labelledby': tabId(k),
    hidden: activeTab !== k,
    tabIndex: 0,
    className: 'focus:outline-none',
  });

  return (
    <div className="w-full">
      {/* ======================== SELECTOR DE TEMAS ======================== */}
      <div
        role="tablist"
        aria-label="Temas de soporte"
        className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0"
      >
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const selected = activeTab === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={tabId(t.key)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(t.key)}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(t.key)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`flex w-[36%] shrink-0 snap-start flex-col items-center gap-2.5 rounded-2xl border-2 bg-white px-3 py-4 text-center cursor-pointer select-none sm:w-[24%] md:w-auto md:py-5 ${
                selected ? 'border-mega-orange shadow-card-hover' : 'border-transparent shadow-card-clean hover:border-mega-orange/40'
              }`}
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-full ${
                  selected ? 'bg-gradient-to-br from-mega-orange to-mega-orange-dark text-white shadow-orange-sm' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`font-display text-xs sm:text-sm font-black leading-tight ${selected ? 'text-mega-navy' : 'text-slate-600'}`}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================ PANELES ============================= */}
      <div ref={panelTopRef} className="mt-5 sm:mt-6 scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:p-12">
        {/* ---------------- 1. ACTIVA TU LÍNEA ---------------- */}
        <section {...panelProps('activacion')}>
          <PanelTitle title="Activa tu línea" text="Conéctate a la Red Mega móvil 4.5G en 3 pasos." />

          <div className="mb-8">
            <Segmented
              label="Tipo de chip"
              value={simType}
              onChange={setSimType}
              options={[
                { value: 'sim', label: 'SIM física', icon: CardSim },
                { value: 'esim', label: 'eSIM', icon: QrCode },
              ]}
            />
          </div>

          <ol className="mx-auto max-w-2xl space-y-6">
            {[
              {
                title: 'Valida tu celular',
                text: (
                  <>
                    Marca <strong className="text-mega-navy">*#06#</strong> para ver tu IMEI. Tu equipo debe estar liberado.
                  </>
                ),
                extra: (
                  <ImeiChecker
                    label="Número IMEI de 15 dígitos"
                    placeholder="IMEI de 15 dígitos"
                    button="Validar"
                    checking="Validando..."
                    invalid="Ingresa un IMEI válido de 15 dígitos (solo números)"
                    success="¡Tu equipo es compatible con Mega móvil!"
                  />
                ),
              },
              simType === 'sim'
                ? { title: 'Inserta tu chip', text: <>Apaga tu celular, coloca el chip Mega móvil y enciéndelo. Se conecta solo a la red.</> }
                : {
                    title: 'Escanea tu código QR',
                    text: (
                      <>
                        En <strong className="text-mega-navy">Ajustes › Datos móviles › Agregar eSIM</strong>, escanea el QR que recibiste al contratar.
                      </>
                    ),
                  },
              simType === 'sim'
                ? {
                    title: 'Instala la configuración',
                    text: (
                      <>
                        Llegará un mensaje de configuración: toca <strong className="text-mega-navy">INSTALAR</strong> y luego{' '}
                        <strong className="text-mega-navy">ACEPTAR</strong>. ¡Listo!
                      </>
                    ),
                  }
                : { title: 'Activa y reinicia', text: <>Activa la línea Mega móvil en tus ajustes y reinicia tu celular.</> },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mega-orange font-display text-sm font-black text-white shadow-orange-sm">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <h3 className="font-display text-base sm:text-lg font-black text-mega-navy">{s.title}</h3>
                  <p className="mt-0.5 text-sm font-medium leading-relaxed text-slate-600">{s.text}</p>
                  {s.extra}
                </div>
              </li>
            ))}
          </ol>

          <SalesNudge icon={CardSim} title="¿Aún no tienes tu chip? Cámbiate y conserva tu número." cta="Ver planes" />
        </section>

        {/* ---------------- 2. CONFIGURA TU EQUIPO ---------------- */}
        <section {...panelProps('configuracion')}>
          <PanelTitle title="Configura tu equipo" text="Elige el sistema de tu celular y sigue los pasos." />

          <div className="mb-8">
            <Segmented
              label="Sistema del celular"
              value={os}
              onChange={setOs}
              options={[
                { value: 'android', label: 'Android', icon: Smartphone },
                { value: 'iphone', label: 'iPhone', icon: Smartphone },
              ]}
            />
          </div>

          {/* Los dos sistemas se generan en el HTML (SEO); solo se muestra el elegido. */}
          {(['android', 'iphone'] as OsKey[]).map((k) => (
            <ol key={k} hidden={os !== k} className="mx-auto max-w-2xl space-y-8">
              {CONFIG_STEPS[k].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mega-orange font-display text-sm font-black text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <h3 className="font-display text-base sm:text-lg font-black text-mega-navy">{step.title}</h3>
                    {step.note && (
                      <p className="mt-2 flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-slate-600">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-mega-orange" aria-hidden="true" />
                        <span>{step.note}</span>
                      </p>
                    )}
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed text-slate-600 marker:font-bold marker:text-slate-400">
                      {step.items.map((item, j) => (
                        <li key={j} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                </li>
              ))}
            </ol>
          ))}

          {/* Roaming de datos: aplica a Android y iPhone (se movió aquí desde "Activa tu línea", igual que en el sitio actual) */}
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-slate-50 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-black text-mega-navy">
              <Globe2 className="h-5 w-5 text-mega-orange" aria-hidden="true" /> Activa Roaming de Datos
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Del menú de tu celular selecciona <strong className="text-mega-navy">Ajustes</strong> o{' '}
              <strong className="text-mega-navy">Configuración</strong>, después Redes móviles y Datos móviles, y habilita la opción Roaming de Datos.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600">
              {['Ajustes', 'Redes móviles', 'Datos móviles', 'Roaming de datos'].map((step, i, arr) => (
                <span key={step} className="inline-flex items-center gap-1.5">
                  <span className={`rounded-full px-3 py-1 ${i === arr.length - 1 ? 'bg-mega-orange text-white' : 'bg-white border border-slate-200'}`}>{step}</span>
                  {i < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                </span>
              ))}
            </p>
          </div>

          {/* Ayuda */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm font-medium text-slate-600">
            ¿Necesitas ayuda con la configuración?{' '}
            <a href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer" className="font-bold text-mega-orange hover:underline underline-offset-4">
              Escríbenos por WhatsApp al {CONTACT.whatsapp.label}
            </a>
          </p>

          <SalesNudge icon={Phone} title="Minutos y SMS incluidos a México, EE.UU. y Canadá en todos los planes." cta="Ver planes" />
        </section>

        {/* ---------------- 3. ATENCIÓN A CLIENTES ---------------- */}
        <section {...panelProps('atencion')}>
          <PanelTitle title="Atención a clientes" text="Te atendemos en México y en el extranjero." />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
            {/* Canal principal: WhatsApp */}
            <div className="relative flex items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-mega-navy via-[#0A1E3D] to-[#0D2854] p-6 sm:p-8 text-white">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-[#4ADE80]">Nacional e internacional</p>
                <h3 className="mt-1 font-display text-2xl font-black">WhatsApp</h3>
                <p className="mt-1 font-display text-lg font-black text-slate-300">{CONTACT.whatsapp.label}</p>
                <div className="mt-5">
                  <ActionButton href={CONTACT.whatsapp.href} icon={WhatsAppIcon} external tone="whatsapp">
                    Abrir chat
                  </ActionButton>
                </div>
              </div>
              {mimoSrc && (
                <img
                  src={mimoSrc}
                  alt="Mimo, la mascota de Mega móvil, saludando"
                  width={140}
                  height={140}
                  loading="lazy"
                  decoding="async"
                  className="h-20 w-20 sm:h-32 sm:w-32 shrink-0 object-contain md:hidden"
                />
              )}
            </div>

            {/* Otros canales: lista simple */}
            <ul className="divide-y divide-slate-100 rounded-3xl border border-slate-200/80 px-5">
              {[
                { icon: Smartphone, label: 'Desde tu línea Mega móvil', value: CONTACT.short.label, href: CONTACT.short.href },
                { icon: Phone, label: 'Llamada nacional (México)', value: CONTACT.phone.label, href: CONTACT.phone.href },
                { icon: MapPin, label: 'Lunes a sábado', value: 'En tu CIS más cercano', href: CONTACT.cis.href, external: true },
                { icon: Mail, label: 'Correo electrónico', value: CONTACT.email.label, href: CONTACT.email.href },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group flex items-center gap-4 py-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-mega-orange">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-500">{c.label}</span>
                        {/* El correo se puede partir solo antes de la @ (en celular no cabe en un renglón); en pantallas grandes se corta con "…". */}
                        <span className="block font-display text-base font-black text-mega-navy group-hover:text-mega-orange sm:truncate">
                          {c.value.includes('@') ? (
                            <>
                              {c.value.split('@')[0]}
                              <wbr />@{c.value.split('@')[1]}
                            </>
                          ) : (
                            c.value
                          )}
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-mega-orange" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ---------------- 4. CONSULTA TU SALDO ---------------- */}
        <section {...panelProps('saldo')}>
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            <PhoneMock>
              <p className="mt-6 text-center font-display text-sm font-black text-white/80">Mensaje para 52142</p>
              <div className="mt-auto space-y-2 px-4 pb-6">
                <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-white px-4 py-2 font-display text-base font-black text-mega-navy">SALDO</div>
                <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md bg-white/25 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                  <span className="h-2 w-2 rounded-full bg-white/60" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </PhoneMock>

            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight text-mega-navy">Consulta tu saldo</h2>
              <p className="mt-3 text-base font-medium text-slate-600">
                Envía un SMS con la palabra <strong className="font-black text-mega-navy">SALDO</strong> al{' '}
                <strong className="font-black text-mega-navy">52142</strong> y recibe tu saldo y vigencia.
              </p>
              <div className="mt-6">
                <ActionButton href="sms:52142?body=SALDO" icon={Send}>
                  Enviar SMS
                </ActionButton>
              </div>
            </div>
          </div>

          <SalesNudge icon={Wifi} title="¿Te quedas sin gigas? Mejora tu plan con redes sociales ilimitadas." cta="Mejorar plan" />
        </section>

        {/* ---------------- 5. DESBLOQUEA TU CELULAR ---------------- */}
        <section {...panelProps('desbloqueo')}>
          <PanelTitle title="Desbloquea tu celular" text="Usa tu chip Mega móvil en el celular que ya tienes. ¿De qué compañía vienes?" />

          <div className="mb-6">
            <Segmented
              label="Compañía actual"
              value={carrier}
              onChange={setCarrier}
              options={CARRIERS.map((c) => ({ value: c.key, label: c.name }))}
            />
          </div>

          <div className="mx-auto max-w-2xl">
            {CARRIERS.map((c) => (
              <div key={c.key} hidden={carrier !== c.key} className="overflow-hidden rounded-3xl bg-mega-navy text-white">
                {TUTORIAL_VIDEOS[c.key].src ? (
                  // preload="none": no descarga nada hasta que el usuario da play; la portada sí se ve desde el inicio.
                  <video
                    data-carrier={c.key}
                    src={TUTORIAL_VIDEOS[c.key].src}
                    poster={TUTORIAL_VIDEOS[c.key].poster}
                    controls
                    playsInline
                    preload="none"
                    className="aspect-video w-full bg-black"
                    aria-label={`Tutorial para desbloquear un celular de ${c.name}`}
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 px-6 text-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-mega-orange text-white shadow-orange-sm">
                      <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-black uppercase">Tutorial de desbloqueo {c.name}</h3>
                    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300">
                      <Clock3 className="h-4 w-4" aria-hidden="true" /> Video disponible próximamente
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <SalesNudge icon={Smartphone} title="Conserva tu celular y tu número: la portabilidad es gratis." cta="Cámbiate ya" />
        </section>
      </div>
    </div>
  );
}
