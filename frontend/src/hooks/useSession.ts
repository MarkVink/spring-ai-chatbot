import { useState, useCallback, useEffect } from 'react';

function generateId(): string {
  return crypto.randomUUID();
}

/** Read session ID from the URL hash (strips leading '#'). */
function readHashId(): string | null {
  const hash = window.location.hash.slice(1); // remove '#'
  // Basic UUID shape check so we don't treat arbitrary anchors as session IDs.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hash)
    ? hash
    : null;
}

function getOrCreateId(): string {
  const existing = readHashId();
  if (existing) {
    return existing;
  }
  const id = generateId();
  window.location.hash = id;
  return id;
}

export function useSession(): { sessionId: string; clearSession: () => void } {
  const [sessionId, setSessionId] = useState<string>(getOrCreateId);

  // Keep state in sync if the user navigates back/forward or manually edits the hash.
  useEffect(() => {
    const onHashChange = () => {
      const id = readHashId();
      if (id && id !== sessionId) {
        setSessionId(id);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [sessionId]);

  const clearSession = useCallback(() => {
    const newId = generateId();
    window.location.hash = newId;
    setSessionId(newId);
  }, []);

  return { sessionId, clearSession };
}
