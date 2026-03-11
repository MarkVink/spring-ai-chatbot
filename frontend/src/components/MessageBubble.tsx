import { useState } from 'react';
import { Copy, Check, User, CalendarCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const responseTimeLabel =
    !isUser && typeof message.responseTimeSeconds === 'number'
      ? `${message.responseTimeSeconds.toFixed(1)}s`
      : null;

  return (
    <div className={`flex gap-3 px-4 py-4 ${isUser ? 'bg-white' : 'bg-slate-50'}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
          ${isUser ? 'bg-teal-600 text-white' : 'bg-slate-700 text-white'}`}
      >
        {isUser ? <User size={15} /> : <CalendarCheck size={15} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-xs font-semibold text-slate-400">
          {isUser ? 'U' : 'Afspraak Assistent'}
        </div>

        {isUser ? (
          <p className="whitespace-pre-wrap text-sm text-slate-800">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg text-sm"
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    );
                  }

                  return (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Copy row for assistant messages */}
        {!isUser && message.content && (
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
            {responseTimeLabel && <span>{responseTimeLabel}</span>}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 transition-colors hover:text-slate-600"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Gekopieerd' : 'Kopieer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
