import { useMemo, useState } from 'react';
import { Send, ChevronLeft, ChevronRight } from 'lucide-react';

const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];
const DUTCH_DAYS_SHORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDutchDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${DUTCH_MONTHS[m - 1]} ${y}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface DateInputProps {
  label: string;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export function DateInput({ label, isLoading, onSubmit }: DateInputProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const todayStr = toDateString(today);

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ dateStr: string; inMonth: boolean }> = [];

    // Padding from previous month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      cells.push({ dateStr: toDateString(d), inMonth: false });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      cells.push({ dateStr: toDateString(d), inMonth: true });
    }

    // Padding to fill last week
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(viewYear, viewMonth + 1, i);
        cells.push({ dateStr: toDateString(d), inMonth: false });
      }
    }

    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  const handleSubmit = () => {
    if (!selected || isLoading) return;
    onSubmit(`Mijn gewenste datum is ${formatDutchDate(selected)}`);
    setSelected(null);
  };

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
      <label className="mb-2 block text-xs font-semibold text-teal-700">{label}</label>

      {/* Calendar */}
      <div className="rounded-lg border border-teal-100 bg-white p-3">
        {/* Month navigation */}
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold capitalize text-slate-700">
            {DUTCH_MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {DUTCH_DAYS_SHORT.map((d) => (
            <span key={d} className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map(({ dateStr, inMonth }, idx) => {
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selected;
            const isDisabled = isPast || !inMonth;

            return (
              <button
                key={idx}
                onClick={() => !isDisabled && setSelected(dateStr)}
                disabled={isDisabled}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm transition-colors
                  ${isDisabled ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer hover:bg-teal-50'}
                  ${isSelected ? 'bg-teal-600 font-semibold text-white hover:bg-teal-700' : ''}
                  ${isToday && !isSelected ? 'font-semibold text-teal-600' : ''}
                  ${!isDisabled && !isSelected && !isToday ? 'text-slate-700' : ''}
                `}
              >
                {Number(dateStr.split('-')[2])}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected + submit */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {selected ? (
            <>Geselecteerd: <strong>{formatDutchDate(selected)}</strong></>
          ) : (
            <span className="text-slate-400">Kies een datum hierboven</span>
          )}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!selected || isLoading}
          className="flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          title="Versturen"
        >
          <Send size={16} />
          Bevestigen
        </button>
      </div>
    </div>
  );
}
