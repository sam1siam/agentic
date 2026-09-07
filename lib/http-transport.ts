import type { Transport } from './types.ts';
/** Explicitly configured origins only. Credentials and redirect policy belong to the host. */
export function httpTransport(
  approvedOrigin: string,
  headers: Record<string, string> = {},
): Transport {
  return {
    async request(url, init) {
      if (new URL(url).origin !== approvedOrigin)
        throw new Error('Origin is not approved by the host.');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), init.timeoutMs);
      try {
        const res = await fetch(url, {
          method: init.method,
          headers: { ...headers, ...init.headers },
          body: init.body,
          redirect: 'error',
          credentials: 'omit',
          signal: controller.signal,
          cache: 'no-store',
        });
        const reader = res.body?.getReader();
        let length = 0;
        const chunks: Uint8Array[] = [];
        if (reader)
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            length += chunk.value.byteLength;
            if (length > 65536) {
              await reader.cancel();
              throw new Error('Response exceeds 64 KiB.');
            }
            chunks.push(chunk.value);
          }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        const text = new TextDecoder().decode(bytes);
        let body: unknown = null;
        try {
          body = JSON.parse(text);
        } catch {
          /* Non-JSON responses cannot establish success. */
        }
        return { status: res.status, body };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
