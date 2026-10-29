import { useId, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  label: string;
  placeholder: string;
  button: string;
  checking: string;
  invalid: string;
  success: string;
  linkLabel?: string;
  linkHref?: string;
}

type Status = 'idle' | 'checking' | 'ok' | 'error';

/** Solo UI: valida formato (15 dígitos) y simula el resultado. */
export default function ImeiChecker({ label, placeholder, button, checking, invalid, success, linkLabel, linkHref }: Props) {
  const id = useId();
  const [imei, setImei] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{15}$/.test(imei)) return setStatus('error');
    setStatus('checking');
    window.setTimeout(() => setStatus('ok'), 700);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-4">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          value={imei}
          inputMode="numeric"
          autoComplete="off"
          maxLength={15}
          placeholder={placeholder}
          aria-invalid={status === 'error'}
          aria-describedby={`${id}-msg`}
          onChange={(e) => {
            setImei(e.target.value.replace(/\D/g, '').slice(0, 15));
            if (status !== 'idle') setStatus('idle');
          }}
          className="h-14 flex-1 rounded-pill border-2 border-mega-blue/20 bg-white px-6 text-lg font-bold tracking-widest text-mega-navy placeholder:font-semibold placeholder:tracking-normal placeholder:text-mega-gray-dark/70 focus:border-mega-blue focus:outline-none"
        />
        <button type="submit" className="btn-primary h-14 shrink-0" disabled={status === 'checking'}>
          {status === 'checking' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {checking}
            </>
          ) : (
            button
          )}
        </button>
      </div>

      <div id={`${id}-msg`} role="status" aria-live="polite" className="mt-3 min-h-6 text-sm font-bold">
        {status === 'error' && (
          <p className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> {invalid}
          </p>
        )}
        {status === 'ok' && (
          <p className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" /> {success}
          </p>
        )}
      </div>

      {linkLabel && linkHref && (
        <a href={linkHref} className="text-sm font-extrabold text-mega-orange underline underline-offset-4 hover:text-white transition">
          {linkLabel}
        </a>
      )}
    </form>
  );
}

