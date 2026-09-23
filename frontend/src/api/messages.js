/**
 * POST /api/chats/:chatId/messages/stream
 *
 * Supports optional file attachment (image, PDF, video, audio).
 * Sends multipart/form-data when a file is present, JSON otherwise.
 *
 * SSE format:
 *   event: chunk\ndata: {"text":"..."}\n\n
 *   event: done\ndata: {}\n\n
 *   event: error\ndata: {"message":"..."}\n\n
 *
 * @param {string}    chatId
 * @param {string}    message
 * @param {File|null} file        - optional File object from <input type="file">
 * @param {Function}  onChunk     - (text: string) => void
 * @param {Function}  onDone      - () => void
 * @param {Function}  onError     - (msg: string) => void
 * @returns {() => void}  abort function
 */
export function streamMessage(chatId, message, file, onChunk, onDone, onError) {
  const controller = new AbortController();
  const token = localStorage.getItem('token');

  const base = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api';

  (async () => {
    let res;
    try {
      let body;
      const headers = {};

      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (file) {
        // Multipart — let the browser set Content-Type with the boundary
        body = new FormData();
        body.append('message', message || '');
        body.append('file', file);
      } else {
        // Plain JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ message });
      }

      res = await fetch(`${base}/chats/${chatId}/messages/stream`, {
        method:  'POST',
        headers,
        body,
        signal:  controller.signal,
      });
    } catch (err) {
      if (err.name !== 'AbortError') onError(err.message || 'Network error');
      return;
    }

    if (!res.ok) {
      let msg = 'Something went wrong. Please try again.';
      try { const j = await res.json(); msg = j.message || msg; } catch { /* ignore */ }
      onError(msg);
      return;
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      let done, value;
      try {
        ({ done, value } = await reader.read());
      } catch (err) {
        if (err.name !== 'AbortError') onError('Stream read error');
        return;
      }

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop(); // keep incomplete tail

      for (const part of parts) {
        if (!part.trim()) continue;
        const lines = part.split('\n');
        let eventName = '', dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataStr  = line.slice(5).trim();
        }
        if (!eventName || !dataStr) continue;
        try {
          const payload = JSON.parse(dataStr);
          if      (eventName === 'chunk') { onChunk(payload.text ?? ''); }
          else if (eventName === 'done')  { onDone(); return; }
          else if (eventName === 'error') { onError(payload.message || 'Stream error'); return; }
        } catch { /* malformed JSON — skip */ }
      }
    }
    onDone();
  })();

  return () => controller.abort();
}
