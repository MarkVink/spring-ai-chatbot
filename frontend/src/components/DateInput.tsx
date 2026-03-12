import { useState } from 'react';
import { Send } from 'lucide-react';

interface DateInputProps {
  label: string;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export function DateInput({ label, isLoading, onSubmit }: DateInputProps) {
  const [date, setDate] = useState('');

  const canSubmit = date.trim().length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(`Mijn gewenste datum is ${date}`);
    setDate('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
      <label className="mb-2 block text-xs font-semibold text-teal-700">{label}</label>
      <div className="flex items-end gap-2">
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-11 flex-1 rounded-xl border border-teal-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          title="Versturen"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}


