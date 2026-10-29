import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Item {
  id: string;
  question: string;
  answer: string;
}

/** Acordeón plano, sin tarjetas ni fondos envolventes. */
export default function Faq({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id || null);

  return (
    <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className="py-1">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${item.id}-panel`}
                id={`${item.id}-btn`}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-base sm:text-lg font-display font-black text-mega-navy hover:text-mega-orange transition-colors"
              >
                <span className={isOpen ? 'text-mega-orange' : ''}>
                  {item.question}
                </span>
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-mega-orange' : 'text-slate-400'
                  }`}
                >
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div
              id={`${item.id}-panel`}
              role="region"
              aria-labelledby={`${item.id}-btn`}
              hidden={!isOpen}
              className="pb-5 pt-0 text-sm sm:text-base leading-relaxed text-slate-600 font-medium"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
