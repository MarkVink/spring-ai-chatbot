import { useState } from 'react';
import { Send } from 'lucide-react';

const DUTCH_POSTCODE_REGEX = /^[1-9][0-9]{3}\s?(?!SA|SD|SS)[A-Z]{2}$/i;

function normalizePostcode(value: string): string {
  const compact = value.replace(/\s+/g, '').toUpperCase();
  if (compact.length === 6) {
    return `${compact.slice(0, 4)} ${compact.slice(4)}`;
  }
  return value.trim().toUpperCase();
}

function isValidDutchPostcode(value: string): boolean {
  return DUTCH_POSTCODE_REGEX.test(value.trim());
}

interface AddressInputProps {
  label: string;
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

export default function AddressInput({ label, isLoading, onSubmit }: AddressInputProps) {
  const [postcode, setPostcode] = useState('');
  const [houseNumber, setHouseNumber] = useState('');

  const normalizedPostcode = normalizePostcode(postcode);
  const postcodeHasValue = postcode.trim().length > 0;
  const postcodeIsValid = isValidDutchPostcode(normalizedPostcode);
  const canSubmit = postcodeIsValid && houseNumber.trim().length > 0 && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(`Mijn postcode is ${normalizedPostcode} en mijn huisnummer is ${houseNumber.trim()}`);
    setPostcode('');
    setHouseNumber('');
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
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Postcode (bijv. 1234 AB)"
          autoFocus
          className="h-11 flex-1 rounded-xl border border-teal-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
        <input
          type="text"
          value={houseNumber}
          onChange={(e) => setHouseNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Huisnummer"
          className="h-11 w-36 rounded-xl border border-teal-300 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
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
      {postcodeHasValue && !postcodeIsValid && (
        <p className="mt-2 text-xs text-red-600">
          Gebruik een geldige Nederlandse postcode, bijvoorbeeld 1234 AB.
        </p>
      )}
    </div>
  );
}

