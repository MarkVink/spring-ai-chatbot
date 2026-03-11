import { useEffect, useRef } from 'react';
import { X, ClipboardList } from 'lucide-react';

interface SystemPromptModalProps {
  prompt: string;
  onClose: () => void;
}

export default function SystemPromptModal({ prompt, onClose }: SystemPromptModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={dialogRef}
        className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
            <ClipboardList size={16} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-800">Systeem prompt</h2>
            <p className="text-xs text-slate-400">Instructies voor de assistent</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Sluiten"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

