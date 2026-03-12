import { useState } from 'react';
import { Send, Mail } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailInputProps {
  label: string;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export default function EmailInput({ label, isLoading, onSubmit }: EmailInputProps) {
  const [email, setEmail] = useState('');

  const trimmedEmail = email.trim();
  const hasValue = trimmedEmail.length > 0;
  const isValid = EMAIL_REGEX.test(trimmedEmail);
  const canSubmit = isValid && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(`Mijn e-mailadres is ${trimmedEmail}`);
    setEmail('');
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
        <div className="relative flex-1">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="bijv. naam@voorbeeld.nl"
            autoFocus
            className="h-11 w-full rounded-xl border border-teal-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          title="Versturen"
        >
          <Send size={18} />
        </button>
      </div>
      {hasValue && !isValid && (
        <p className="mt-2 text-xs text-red-600">
          Voer een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.
        </p>
      )}
    </div>
  );
}

