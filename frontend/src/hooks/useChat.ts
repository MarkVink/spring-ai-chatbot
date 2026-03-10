import { useState, useCallback, useEffect, useRef } from 'react';
import type { Message } from '../types/chat';
import { fetchHistory, sendMessageStream } from '../api/chatApi';

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    fetchHistory(sessionId)
      .then((history) => {
        setMessages(history);
        setIsHistoryLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setIsHistoryLoaded(true); // still mark as loaded so UI renders
      });
  }, [sessionId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);

      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Add a placeholder assistant message that we'll stream into
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMessage]);

      const controller = sendMessageStream(
        sessionId,
        content,
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + token,
              };
            }
            return updated;
          });
        },
        () => {
          setIsLoading(false);
        },
        (err) => {
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
        }
      );

      abortRef.current = controller;
    },
    [sessionId, isLoading]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, isHistoryLoaded, sendMessage, stopStreaming, clearMessages };
}

