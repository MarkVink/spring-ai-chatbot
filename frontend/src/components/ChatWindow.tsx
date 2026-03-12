import { useRef, useEffect } from 'react';
import type { Message } from '../types/chat';
import AddressInput from './AddressInput';
import { DateInput } from './DateInput';
import MessageBubble from './MessageBubble';
import TimeInput from './TimeInput';
import TypingIndicator from './TypingIndicator';
import { CalendarCheck, MapPin, Clock, CheckCircle2 } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSubmitSpecialInput: (message: string) => void;
}

export default function ChatWindow({ messages, isLoading, onSubmitSpecialInput }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const renderSpecialInput = (message: Message) => {
    if (!message.specialInput) {
      return null;
    }

    switch (message.specialInput.type) {
      case 'address':
        return (
          <AddressInput
            label={message.specialInput.label}
            isLoading={isLoading}
            onSubmit={onSubmitSpecialInput}
          />
        );
      case 'date':
        return (
          <DateInput
            label={message.specialInput.label}
            isLoading={isLoading}
            onSubmit={onSubmitSpecialInput}
          />
        );
      case 'time':
        return (
          <TimeInput
            label={message.specialInput.label}
            isLoading={isLoading}
            onSubmit={onSubmitSpecialInput}
          />
        );
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50 shadow-inner">
          <CalendarCheck size={40} className="text-teal-600" />
        </div>

        {/* Intro text */}
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800">Afspraak maken</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Onze digitale assistent helpt u snel en eenvoudig een afspraak inplannen.
            Stuur een bericht om te beginnen.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-6 py-4 text-left shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            U wordt gevraagd naar
          </p>
          {[
            { icon: MapPin,       label: 'Postcode & huisnummer' },
            { icon: CalendarCheck, label: 'Gewenste datum' },
            { icon: Clock,        label: 'Gewenst tijdstip' },
            { icon: CheckCircle2, label: 'Bevestiging van uw afspraak' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
              <Icon size={15} className="shrink-0 text-teal-500" />
              {label}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400">Typ uw bericht hieronder om te starten →</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl divide-y divide-slate-100">
        {messages.map((msg, i) => {
          const isLastAssistantMessage = i === messages.length - 1 && msg.role === 'assistant';

          return (
            <div key={i}>
              <MessageBubble message={msg} />
              {isLastAssistantMessage && msg.specialInput && (
                <div className="bg-slate-50 px-4 pb-4 pl-[60px]">
                  {renderSpecialInput(msg)}
                </div>
              )}
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3 bg-slate-50 px-4 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
              <CalendarCheck size={15} />
            </div>
            <TypingIndicator />
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
