import type { Message } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) {
    return path;
  }

  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${normalizedBase}${path}`;
}

export async function fetchHistory(sessionId: string): Promise<Message[]> {
  const res = await fetch(buildApiUrl(`/api/chat/history/${sessionId}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  return res.json();
}

export async function sendMessageBlocking(
  sessionId: string,
  message: string,
  model?: string
): Promise<string> {
  const res = await fetch(buildApiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, model }),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.message;
}

function parseSseEvent(rawEvent: string): { event?: string; data: string } | null {
  const dataLines: string[] = [];
  let eventType: string | undefined;

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      const value = line.slice(6);
      eventType = value.startsWith(' ') ? value.slice(1) : value;
      continue;
    }

    if (!line.startsWith('data:')) {
      continue;
    }

    // Per SSE spec, there can be one optional space after ':'.
    const payload = line.charAt(5) === ' ' ? line.slice(6) : line.slice(5);
    dataLines.push(payload.endsWith('\r') ? payload.slice(0, -1) : payload);
  }

  if (dataLines.length === 0) {
    return null;
  }

  return { event: eventType, data: dataLines.join('\n') };
}

interface StreamChunk {
  token: string;
}

export function sendMessageStream(
  sessionId: string,
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
  model?: string
): AbortController {
  const controller = new AbortController();

  fetch(buildApiUrl('/api/chat/stream'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, model }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Stream request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let eventBoundary = buffer.indexOf('\n\n');
        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          const sse = parseSseEvent(rawEvent);
          if (!sse || sse.data === '' || sse.data === '[DONE]') {
            eventBoundary = buffer.indexOf('\n\n');
            continue;
          }

          if (!sse.event || sse.event === 'token') {
            try {
              const chunk = JSON.parse(sse.data) as StreamChunk;
              if (typeof chunk.token === 'string' && chunk.token.length > 0) {
                onToken(chunk.token);
              }
            } catch {
              // Backward compatibility with plain string SSE payloads.
              onToken(sse.data);
            }
          }

          eventBoundary = buffer.indexOf('\n\n');
        }
      }

      // Handle final event if stream closes without a trailing separator.
      const trailing = parseSseEvent(buffer.replace(/\r\n/g, '\n'));
      if (trailing && trailing.data !== '' && trailing.data !== '[DONE]') {
        if (!trailing.event || trailing.event === 'token') {
          try {
            const chunk = JSON.parse(trailing.data) as StreamChunk;
            if (typeof chunk.token === 'string' && chunk.token.length > 0) {
              onToken(chunk.token);
            }
          } catch {
            onToken(trailing.data);
          }
        }
      }

      onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    });

  return controller;
}

export interface AvailableModelsResponse {
  models: string[];
  defaultModel: string;
}

export async function fetchModels(): Promise<AvailableModelsResponse> {
  const res = await fetch(buildApiUrl('/api/chat/models'));
  if (!res.ok) {
    throw new Error(`Failed to fetch models: ${res.status}`);
  }
  return res.json();
}
