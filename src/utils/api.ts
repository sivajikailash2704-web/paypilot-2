/**
 * Safe fetch & JSON parsing utilities to prevent syntax errors like:
 * "Unexpected token 'T', "The page c"... is not valid JSON"
 * which occurs when an endpoint returns HTML (e.g. 404, 502, cold-start) instead of JSON.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function parseResponseSafe<T = any>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (isJson) {
    try {
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
        return { ok: false, status: res.status, data, error: errorMsg };
      }
      return { ok: true, status: res.status, data };
    } catch (parseErr: any) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Invalid JSON returned by server (${res.status}): ${parseErr.message || 'Parse error'}`,
      };
    }
  }

  // Handle HTML or plain text response
  const text = await res.text().catch(() => '');
  let snippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  if (snippet.length > 120) snippet = snippet.substring(0, 120) + '...';

  const errorMsg = !res.ok
    ? `Server returned HTTP ${res.status} error: ${snippet || res.statusText || 'Unknown error'}`
    : `Server returned non-JSON response (${contentType || 'text'}): ${snippet}`;

  return {
    ok: false,
    status: res.status,
    data: null,
    error: errorMsg,
  };
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    return await parseResponseSafe<T>(res);
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr.message ? `Network request failed: ${netErr.message}` : 'Network error: could not connect to server.',
    };
  }
}
