import { useEffect, useState } from 'react';

interface Props {
  /** Fecha objetivo ISO (se edita en nav.json). */
  target: string;
  label?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function Countdown({ target, label }: Props) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  // Vencida: no se muestra para no generar falsa urgencia.
  if (left === 0) return null;

  const s = left === null ? null : Math.floor(left / 1000);
  const parts = s === null
    ? ['--', '--', '--', '--']
    : [pad(Math.floor(s / 86400)), pad(Math.floor((s % 86400) / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];
  const units = ['d', 'h', 'm', 's'];

  return (
    <span className="inline-flex items-center gap-2 text-sm font-bold">
      {label && <span className="hidden md:inline">{label}</span>}
      <span className="inline-flex gap-1 font-black tabular-nums" role="timer" aria-label={label}>
        {parts.map((p, i) => (
          <span key={units[i]} className="rounded-md bg-mega-navy/90 px-1.5 py-0.5 text-white">
            {p}
            <span className="text-[10px] font-bold opacity-80">{units[i]}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

