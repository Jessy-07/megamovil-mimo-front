import { useState } from 'react';

const targets: Record<number, string> = {
  1: 'plan-conectado-30gb',
  2: 'plan-familiar-2-lineas',
  3: 'plan-familiar-3-lineas',
  4: 'plan-familiar-4-lineas',
};

export default function LinesSelector() {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (lines: number) => {
    setSelected(lines);

    // Cambiar de pestaña si es necesario
    if (lines === 1) {
      window.dispatchEvent(new CustomEvent('select-plan-tab', { detail: 'individual' }));
    } else {
      window.dispatchEvent(new CustomEvent('select-plan-tab', { detail: 'family' }));
    }

    const targetId = targets[lines];
    if (!targetId) return;

    window.setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('plan-highlight-pulse');
        void el.offsetWidth;
        el.classList.add('plan-highlight-pulse');
        window.setTimeout(() => {
          el.classList.remove('plan-highlight-pulse');
        }, 3600);
      }
    }, 50);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
      <span className="font-display text-xs sm:text-sm font-black uppercase tracking-wider text-mega-navy flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-mega-orange animate-ping"></span>
        ¿Cuántas líneas necesitas?
      </span>
      <div className="inline-flex rounded-full bg-white p-1 border border-slate-200 shadow-sm">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleSelect(num)}
            className={`min-w-[46px] sm:min-w-[56px] rounded-full py-1.5 px-3.5 text-xs sm:text-sm font-display font-black uppercase transition-all duration-200 ${
              selected === num
                ? 'bg-gradient-to-r from-mega-orange to-[#FF7020] text-white shadow-orange-sm scale-105'
                : 'text-slate-600 hover:text-mega-orange hover:bg-orange-50/50'
            }`}
          >
            {num === 1 ? '1 Línea' : `${num} Líneas`}
          </button>
        ))}
      </div>
    </div>
  );
}
