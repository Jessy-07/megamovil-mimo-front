import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import type { Layer, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Mapa de cobertura Mega móvil dentro del sitio.
 * - Capa de cobertura: la MISMA del mapa oficial (cobertura.megacable.com.mx/megamovil), servida por geomega.com.mx (WMTS de Megacable).
 *   El mapa oficial no se puede incrustar (X-Frame-Options: DENY), pero su capa sí se puede usar en un mapa propio.
 * - Mapa base: OpenStreetMap en gris (filtro CSS .leaflet-basemap-gray en global.css) para que resalte la capa azul.
 *   PENDIENTE: OSM no permite uso intensivo en producción; contratar un proveedor (MapTiler, Mapbox, Google Maps) antes del lanzamiento.
 * - Sugerencias al escribir calle/colonia: Photon (photon.komoot.io, OSM, hecho para "buscar mientras escribes"). No se piden
 *   para códigos postales (solo números). Al enviar (Buscar/Enter sin sugerencia elegida): Nominatim (OSM), que sí resuelve CP.
 *   PENDIENTE: ambos son servicios públicos con uso justo; cambiar por el buscador de colonias de Megacable
 *   (solr.php del mapa oficial, que exige su sesión) o por un geocodificador comercial antes del lanzamiento.
 * - Al borrar el texto, el mapa vuelve a la vista completa de México.
 * - La búsqueda se marca con un CONTORNO naranja (colonia/CP si OSM trae el polígono; si no, un círculo del área aproximada),
 *   para que se vea si cae dentro de la zona azul. No se puede saber por código si un punto tiene cobertura (las imágenes de la capa no permiten leer sus píxeles por CORS):
 *   el usuario lo ve en el mapa (zona azul).
 */

interface Props {
  coverageTilesUrl: string;
  searchPlaceholder: string;
  legend: string;
  legendNote: string;
  foundMessage: string;
  ctaLabel: string;
  ctaHref: string;
}

const MEXICO_CENTER: [number, number] = [23.6, -102.5];
const MEXICO_BOUNDS: [[number, number], [number, number]] = [
  [34.01, -117.76],
  [13.98, -80.23],
];

interface Suggestion {
  id: string;
  title: string;
  detail: string;
  /** Texto corto para el mensaje: calle + municipio. */
  short: string;
  lat: number;
  lon: number;
  /** [sur, norte, oeste, este], como el boundingbox de Nominatim. */
  box?: string[];
}
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id: number;
    osm_type: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
    extent?: [number, number, number, number];
  };
}

const toSuggestion = (f: PhotonFeature): Suggestion => {
  const p = f.properties;
  const title = [p.name ?? p.street, p.housenumber].filter(Boolean).join(' ') || p.city || p.state || '';
  const detail = [...new Set([p.locality ?? p.district, p.city ?? p.county, p.state, p.postcode ? `C.P. ${p.postcode}` : ''])]
    .filter((v) => v && v !== title)
    .join(', ');
  const [lon, lat] = f.geometry.coordinates;
  const box = p.extent ? [p.extent[3], p.extent[1], p.extent[0], p.extent[2]].map(String) : undefined;
  const short = [title, p.city ?? p.county].filter((v, i, a) => v && a.indexOf(v) === i).join(", ");
  return { id: `${p.osm_type}${p.osm_id}`, title, detail, short, lat, lon, box };
};

type Status =
  | { kind: 'idle' }
  | { kind: 'loading'; text: string }
  | { kind: 'found'; place: string }
  | { kind: 'error'; text: string };

export default function CoverageMap({ coverageTilesUrl, searchPlaceholder, legend, legendNote, foundMessage, ctaLabel, ctaHref }: Props) {
  const inputId = useId();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const areaRef = useRef<Layer | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [areaShown, setAreaShown] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Evita volver a pedir sugerencias cuando el texto lo puso una sugerencia elegida. */
  const skipSuggestRef = useRef(false);
  const listId = `${inputId}-sugerencias`;

  /** Sugerencias ya pedidas (texto → lista): al borrar o regresar letras aparecen al instante. */
  const cacheRef = useRef(new Map<string, Suggestion[]>());
  const [suggesting, setSuggesting] = useState(false);

  /*
   * Sugerencias mientras se escribe calle/colonia (no para CP: solo números).
   * Photon tarda ~1.5–3 s en responder (su servidor), así que: espera corta (200 ms), caché, "Buscando…" inmediato
   * y sesgo hacia lo que se ve en el mapa (lat/lon) en vez de bbox, que en sus pruebas era más lento. Se filtra a México aquí.
   */
  useEffect(() => {
    const q = query.trim();
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    if (q.length < 3 || /^\d+$/.test(q)) {
      setSuggestions([]);
      setListOpen(false);
      setSuggesting(false);
      return;
    }
    const key = q.toLowerCase();
    const cached = cacheRef.current.get(key);
    if (cached) {
      setSuggestions(cached);
      setActive(-1);
      setListOpen(cached.length > 0);
      setSuggesting(false);
      return;
    }
    setSuggesting(true);
    setListOpen(true);
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const c = mapRef.current?.getCenter();
        const bias = c && mapRef.current!.getZoom() >= 7 ? `&lat=${c.lat.toFixed(3)}&lon=${c.lng.toFixed(3)}` : `&lat=${MEXICO_CENTER[0]}&lon=${MEXICO_CENTER[1]}`;
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10${bias}`, { signal: ctrl.signal });
        const data: { features: PhotonFeature[] } = await res.json();
        const list = data.features
          .filter((f) => f.properties.countrycode === 'MX')
          .map(toSuggestion)
          .filter((s, i, all) => s.title && all.findIndex((o) => o.title === s.title && o.detail === s.detail) === i)
          .slice(0, 5);
        cacheRef.current.set(key, list);
        setSuggestions(list);
        setActive(-1);
        setListOpen(list.length > 0);
      } catch {
        /* abortada o sin red: sin sugerencias; "Buscar" sigue funcionando */
      } finally {
        if (!ctrl.signal.aborted) setSuggesting(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  /* Vuelve a la vista completa de México: sin contorno, sin velo, sin mensaje. */
  const resetMap = () => {
    areaRef.current?.remove();
    areaRef.current = null;
    setAreaShown(false);
    setStatus({ kind: 'idle' });
    setSuggestions([]);
    setListOpen(false);
    mapRef.current?.flyTo(MEXICO_CENTER, window.innerWidth < 640 ? 4 : 5, { duration: 0.6 });
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) resetMap();
  };

  const pickSuggestion = (s: Suggestion) => {
    skipSuggestRef.current = true;
    setQuery(s.detail ? `${s.title}, ${s.detail}` : s.title);
    setListOpen(false);
    setSuggestions([]);
    showArea({ lat: s.lat, lon: s.lon, radius: radiusFromBox(s.box) }, s.short);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!listOpen || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[active]);
    } else if (e.key === 'Escape') {
      setListOpen(false);
    }
  };

  /* Leaflet solo existe en el navegador: se carga aquí. */
  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      const L = (mod as unknown as { default?: typeof import('leaflet') }).default ?? mod;
      if (cancelled || !mapEl.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapEl.current, {
        center: MEXICO_CENTER,
        zoom: window.innerWidth < 640 ? 4 : 5,
        minZoom: 4,
        maxBounds: MEXICO_BOUNDS,
        maxBoundsViscosity: 0.8,
        scrollWheelZoom: false, // no secuestra el scroll de la página; se activa al hacer clic en el mapa
        attributionControl: true,
      });
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'leaflet-basemap-gray',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> · Cobertura &copy; Megacable',
      }).addTo(map);
      // className → filtro SVG #mm-coverage-filter (global.css): relleno azul suave + contorno marcado.
      L.tileLayer(coverageTilesUrl, { maxNativeZoom: 12, maxZoom: 19, className: 'leaflet-coverage' }).addTo(map);
      map.on('click', () => map.scrollWheelZoom.enable());
      mapRef.current = map;
      // El contenedor puede terminar de medirse después de crear el mapa: recalcula para no dejar franjas grises.
      window.setTimeout(() => map.invalidateSize(), 200);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [coverageTilesUrl]);

  /*
   * Búsqueda = "reflector": contorno naranja del área (polígono real si existe; si no, círculo del área aproximada)
   * y TODO lo de afuera se aclara con un velo blanco. Así solo se ve la cobertura (azul) dentro de tu zona.
   */
  const AREA_STYLE = { color: '#FF5900', weight: 4, opacity: 1, fill: false };
  const VEIL_STYLE = { stroke: false, fillColor: '#ffffff', fillOpacity: 0.5, interactive: false };
  const showArea = (area: { lat: number; lon: number; radius: number; geojson?: GeoJSON.Geometry }, place: string) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    areaRef.current?.remove();

    // Anillos del área en [lat, lon]: los del polígono, o un círculo de 72 puntos.
    let rings: [number, number][][];
    if (area.geojson?.type === 'Polygon') rings = [area.geojson.coordinates[0].map(([x, y]) => [y, x] as [number, number])];
    else if (area.geojson?.type === 'MultiPolygon') rings = area.geojson.coordinates.map((poly) => poly[0].map(([x, y]) => [y, x] as [number, number]));
    else {
      const dLat = area.radius / 111_320;
      const dLon = area.radius / (111_320 * Math.cos((area.lat * Math.PI) / 180));
      rings = [Array.from({ length: 72 }, (_, i) => {
        const t = (i / 72) * 2 * Math.PI;
        return [area.lat + dLat * Math.sin(t), area.lon + dLon * Math.cos(t)] as [number, number];
      })];
    }
    const world: [number, number][] = [[85, -180], [85, 180], [-85, 180], [-85, -180]];
    const veil = L.polygon([world, ...rings], VEIL_STYLE);
    const outline = L.polygon(rings, { ...AREA_STYLE, interactive: false });
    const group = L.featureGroup([veil, outline]).addTo(map);
    areaRef.current = group;
    map.fitBounds(outline.getBounds(), { padding: [40, 40], maxZoom: 15 });
    setAreaShown(true);
    setStatus({ kind: 'found', place });
  };

  /* Radio del círculo a partir del recuadro que da el buscador (p. ej. el área de un código postal), entre 400 m y 4 km. */
  const radiusFromBox = (box?: string[]) => {
    if (!box || box.length < 4) return 600;
    const [s1, n1, w1, e1] = box.map(Number);
    const h = (n1 - s1) * 111_000;
    const w = (e1 - w1) * 111_000 * Math.cos((((s1 + n1) / 2) * Math.PI) / 180);
    return Math.min(Math.max(Math.hypot(h, w) / 2, 400), 4000);
  };

  const onSearch = async (e: FormEvent) => {
    e.preventDefault();
    setListOpen(false);
    const q = query.trim();
    if (q.length < 3) return setStatus({ kind: 'error', text: 'Escribe tu colonia y ciudad, o tu código postal.' });
    setStatus({ kind: 'loading', text: 'Buscando…' });
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=mx&limit=1&accept-language=es&polygon_geojson=1&polygon_threshold=0.0002&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data: Array<{ lat: string; lon: string; display_name: string; boundingbox?: string[]; geojson?: GeoJSON.Geometry }> = await res.json();
      if (!data.length) return setStatus({ kind: 'error', text: 'No encontramos esa dirección. Prueba con colonia y ciudad, o tu código postal.' });
      const [hit] = data;
      const isArea = hit.geojson && (hit.geojson.type === 'Polygon' || hit.geojson.type === 'MultiPolygon');
      showArea(
        { lat: parseFloat(hit.lat), lon: parseFloat(hit.lon), radius: radiusFromBox(hit.boundingbox), geojson: isArea ? hit.geojson : undefined },
        hit.display_name.split(',').slice(0, 2).join(','),
      );
    } catch {
      setStatus({ kind: 'error', text: 'No pudimos buscar en este momento. Intenta de nuevo.' });
    }
  };

  const onLocate = () => {
    if (!('geolocation' in navigator)) return setStatus({ kind: 'error', text: 'Tu navegador no permite usar tu ubicación.' });
    setStatus({ kind: 'loading', text: 'Buscando tu ubicación…' });
    navigator.geolocation.getCurrentPosition(
      (pos) => showArea({ lat: pos.coords.latitude, lon: pos.coords.longitude, radius: Math.max(pos.coords.accuracy, 300) }, 'Tu ubicación'),
      () => setStatus({ kind: 'error', text: 'No pudimos obtener tu ubicación. Revisa los permisos o escribe tu dirección.' }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      {/* Buscador + Mi ubicación */}
      {/* z-10 + "isolate" en el mapa: la lista de sugerencias queda por encima de los controles de Leaflet (zoom, z-index 1000). */}
      <form onSubmit={onSearch} className="relative z-10 flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          {searchPlaceholder}
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-mega-orange" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => suggestions.length && setListOpen(true)}
            onBlur={() => setListOpen(false)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="h-14 w-full rounded-full border-2 border-slate-200 bg-slate-50 pl-14 pr-12 text-base font-semibold text-mega-navy placeholder:font-medium placeholder:text-slate-400 focus:border-mega-orange focus:bg-white focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Borrar búsqueda y ver todo el mapa"
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-slate-200 text-slate-600 hover:bg-mega-orange hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          {/* Sugerencias de calle / colonia */}
          {listOpen && (
            <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white py-2 shadow-card-clean">
              {suggesting && !suggestions.length && (
                <li className="flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-slate-500" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin text-mega-orange" aria-hidden="true" /> Buscando direcciones…
                </li>
              )}
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault(); // que el input no pierda el foco antes de elegir
                    pickSuggestion(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-start gap-3 px-5 py-2.5 ${i === active ? 'bg-orange-50' : ''}`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mega-orange" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-mega-navy">{s.title}</span>
                    {s.detail && <span className="block truncate text-xs font-semibold text-slate-500">{s.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2.5">
          <button type="submit" className="btn-primary h-14 flex-1 sm:flex-none" disabled={status.kind === 'loading'}>
            Buscar
          </button>
          <button
            type="button"
            onClick={onLocate}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-2 border-mega-navy px-5 font-display text-sm font-black uppercase tracking-wider text-mega-navy hover:bg-mega-navy hover:text-white sm:flex-none cursor-pointer"
          >
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
            Mi ubicación
          </button>
        </div>
      </form>

      {/* Resultado */}
      <div role="status" aria-live="polite" className="mt-3 min-h-[1.75rem] text-sm sm:text-base">
        {status.kind === 'loading' && (
          <p className="inline-flex items-center gap-2 font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {status.text}
          </p>
        )}
        {status.kind === 'error' && <p className="font-semibold text-red-700">{status.text}</p>}
        {status.kind === 'found' && (
          <div className="flex flex-col gap-3 rounded-2xl bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-mega-navy">
              <strong className="font-black">{status.place}</strong> · {foundMessage}
            </p>
            <a href={ctaHref} className="btn-primary shrink-0 !px-6 !py-3 !text-sm">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="relative isolate z-0 mt-2 overflow-hidden rounded-3xl ring-1 ring-slate-200">
        <div ref={mapEl} className="h-[360px] w-full bg-slate-100 sm:h-[460px]" role="region" aria-label="Mapa de cobertura Mega móvil" />
        <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-card-clean">
          <p className="flex items-center gap-2 text-xs sm:text-sm font-black text-mega-navy">
            <span className="h-3.5 w-3.5 rounded-[4px] border-2 border-[#0066CC] bg-[#0066CC]/25" aria-hidden="true" />
            {legend}
          </p>
          {areaShown && (
            <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-black text-mega-navy">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-mega-orange bg-mega-orange/15" aria-hidden="true" />
              Tu búsqueda
            </p>
          )}
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{legendNote}</p>
        </div>

        {/* Filtro que redibuja la capa de cobertura: une el punteado (desenfoque + umbral), rellena en azul suave y traza el contorno. */}
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
          <filter id="mm-coverage-filter" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
            <feComponentTransfer in="blur" result="mask">
              <feFuncA type="discrete" tableValues="0 1 1 1 1" />
            </feComponentTransfer>
            <feMorphology in="mask" operator="erode" radius="1.6" result="inner" />
            <feComposite in="mask" in2="inner" operator="out" result="edge" />
            <feFlood floodColor="#0066CC" floodOpacity="0.22" result="fillColor" />
            <feComposite in="fillColor" in2="mask" operator="in" result="fill" />
            <feFlood floodColor="#0066CC" result="lineColor" />
            <feComposite in="lineColor" in2="edge" operator="in" result="line" />
            <feMerge>
              <feMergeNode in="fill" />
              <feMergeNode in="line" />
            </feMerge>
          </filter>
        </svg>
      </div>
    </div>
  );
}
