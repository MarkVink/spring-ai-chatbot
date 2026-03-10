import { useState, useCallback } from 'react';

const SESSION_KEY = 'spring-ai-chatbot-session-id';

function generateId(): string {
  return crypto.randomUUID();
}

function getOrCreateId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useSession(): { sessionId: string; clearSession: () => void } {
  const [sessionId, setSessionId] = useState<string>(getOrCreateId);

  const clearSession = useCallback(() => {
    const newId = generateId();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
  }, []);

  return { sessionId, clearSession };
}

