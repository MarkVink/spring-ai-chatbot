import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { fetchHistory, sendMessageStream } from '../api/chatApi';

const INPUT_DIRECTIVE_REGEX = /\[\[INPUT:(address|date|time|email)(?:\|label=([^\]]*))?\]\]/i;
const INPUT_START_MARKER = '[[INPUT:';

function parseAssistantContent(rawContent: string): Pick<Message, 'content' | 'specialInput'> {
  const match = rawContent.match(INPUT_DIRECTIVE_REGEX);

  return {
    content: stripInputDirective(rawContent),
    specialInput: match
      ? {
          type: match[1] as 'address' | 'date' | 'time' | 'email',
          label: match[2]?.trim() || defaultLabelForType(match[1] as 'address' | 'date' | 'time' | 'email'),
        }
      : undefined,
  };
}

function defaultLabelForType(type: 'address' | 'date' | 'time' | 'email'): string {
  switch (type) {
    case 'address':
      return 'Vul uw postcode en huisnummer in';
    case 'date':
      return 'Kies uw gewenste datum';
    case 'time':
      return 'Kies uw gewenste tijd';
    case 'email':
      return 'Vul uw e-mailadres in';
  }
}

function stripInputDirective(rawContent: string): string {
  const startIndex = rawContent.indexOf(INPUT_START_MARKER);
  if (startIndex === -1) {
    return rawContent;
  }

  return rawContent.slice(0, startIndex).trimEnd();
}

function normalizeHistoryMessages(history: Message[]): Message[] {
  return history.map((message) => {
    if (message.role !== 'assistant') {
      return message;
    }

    return {
      ...message,
      ...parseAssistantContent(message.content),
    };
  });
}

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamRawContentRef = useRef('');

  // Load history on mount
  useEffect(() => {
    fetchHistory(sessionId)
      .then((history) => {
        setMessages(normalizeHistoryMessages(history));
        setIsHistoryLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setIsHistoryLoaded(true); // still mark as loaded so UI renders
      });
  }, [sessionId]);

  const sendMessage = useCallback(
    (content: string, model?: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      streamRawContentRef.current = '';

      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add a placeholder assistant message that we'll stream into
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMessage]);

      const requestStartMs = performance.now();

      const controller = sendMessageStream(
        sessionId,
        content,
        (token) => {
          streamRawContentRef.current += token;
          const parsedAssistantMessage = parseAssistantContent(streamRawContentRef.current);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                ...parsedAssistantMessage,
              };
            }
            return updated;
          });
        },
        () => {
          const elapsedSeconds = (performance.now() - requestStartMs) / 1000;
          streamRawContentRef.current = '';
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant' && last.content.trim().length > 0) {
              updated[updated.length - 1] = {
                ...last,
                responseTimeSeconds: elapsedSeconds,
              };
            }
            return updated;
          });
          setIsLoading(false);
        },
        (err) => {
          streamRawContentRef.current = '';
          setError(err.message || 'Something went wrong');
          setIsLoading(false);
          // Remove the empty assistant placeholder on error
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last.role === 'assistant' && last.content === '') {
              return prev.slice(0, -1);
            }
            return prev;
          });
        },
        model
      );

      abortRef.current = controller;
    },
    [sessionId, isLoading]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    streamRawContentRef.current = '';
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, isHistoryLoaded, sendMessage, stopStreaming, clearMessages };
}
