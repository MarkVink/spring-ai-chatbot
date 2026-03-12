import { useState } from 'react';
import { Send } from 'lucide-react';

// Generate time slots from 08:00 to 20:00 in 30-minute increments
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('20:00');
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface TimeInputProps {
  label: string;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export default function TimeInput({ label, isLoading, onSubmit }: TimeInputProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selected || isLoading) return;
    onSubmit(`Mijn gewenste tijd is ${selected}`);
    setSelected(null);
  };

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
      <label className="mb-2 block text-xs font-semibold text-teal-700">{label}</label>

      {/* Time slot grid */}
      <div className="rounded-lg border border-teal-100 bg-white p-3">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {TIME_SLOTS.map((slot) => {
            const isSelected = slot === selected;

            return (
              <button
                key={slot}
                onClick={() => setSelected(slot)}
                className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors
                  ${isSelected
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                  }
                `}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected + submit */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {selected ? (
            <>Geselecteerd: <strong>{selected}</strong></>
          ) : (
            <span className="text-slate-400">Kies een tijdstip hierboven</span>
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
