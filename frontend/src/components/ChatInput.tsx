import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string, model?: string) => void;
  onStop: () => void;
  isLoading: boolean;
  selectedModel: string;
}

export default function ChatInput({
  onSend,
  onStop,
  isLoading,
  selectedModel,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim(), selectedModel || undefined);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Typ hier uw bericht…"
          rows={1}
          className="chat-input-textarea flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm
                     outline-none transition-colors
                     focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
        />
        {isLoading ? (
          <button
            onClick={onStop}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                       bg-red-500 text-white transition-colors hover:bg-red-600"
            title="Stoppen"
          >
            <Square size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                       bg-teal-600 text-white transition-colors hover:bg-teal-700
                       disabled:cursor-not-allowed disabled:bg-slate-300"
            title="Versturen"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
