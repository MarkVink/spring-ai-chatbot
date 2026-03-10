import { useMemo } from 'react';

const SESSION_KEY = 'spring-ai-chatbot-session-id';

function generateId(): string {
  return crypto.randomUUID();
}

export function useSession(): string {
  return useMemo(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }, []);
}

