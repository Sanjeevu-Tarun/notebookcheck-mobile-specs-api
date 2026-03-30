import axios from 'axios';

// Your flaskresolver instance on Render
// Set FLARESOLVERR_URL=https://flaskresolver.onrender.com in your .env / Vercel env vars
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL

// ── TIMEOUT SETTINGS ─────────────────────────────────────────────────────────
// flaskresolver uses lightweight Python requests (no Chrome) → much faster and
// uses ~50MB RAM vs 500MB+ for headless Chrome. This is why you hit memory limits
// before: old code assumed a real Chrome-based FlareSolverr.
const CF_TIMEOUT_MS = 20000; // 20s — enough for Render cold start + solve

// ── API SHAPE ─────────────────────────────────────────────────────────────────
// flaskresolver native:     POST /solve  { "url": "..." }
//                        →  { "html": "...", "status": 200 }
//
// FlareSolverr compatible:  POST /v1  { "cmd":"request.get", "url":"...", "maxTimeout":N }
//                        →  { "solution": { "response": "...", "status": 200 } }
//
// We try /solve first (native flaskresolver), then fall back to /v1.

interface FlaskResolverResponse {
  html?: string;
  body?: string;
  content?: string;
  status?: number;
  error?: string;
}

interface FlareSolverrResponse {
  solution?: { response?: string; status?: number };
  status?: string;
}

// ── IN-FLIGHT DEDUPLICATION ──────────────────────────────────────────────────
// Prevents duplicate Render requests for same URL when multiple callers fire at once.
const _inFlightCF = new Map<string, Promise<string>>();

// Warm up the Render free-tier instance (call on startup to avoid cold-start during real requests)
export async function pingFlaskResolver(): Promise<boolean> {
  try {
    const res = await axios.get(`${FLARESOLVERR_URL}/health`, { timeout: 10000 });
    return res.status === 200;
  } catch {
    try {
      const res = await axios.get(FLARESOLVERR_URL, { timeout: 10000 });
      return res.status < 500;
    } catch { return false; }
  }
}

export async function fetchWithCF(url: string): Promise<string> {
  const existing = _inFlightCF.get(url);
  if (existing) return existing;

  const promise = (async (): Promise<string> => {
    try {
      // Strategy 1: flaskresolver native API (POST /solve)
      try {
        const res = await axios.post<FlaskResolverResponse>(
          `${FLARESOLVERR_URL}/solve`,
          { url },
          { headers: { 'Content-Type': 'application/json' }, timeout: CF_TIMEOUT_MS }
        );
        const html = res.data?.html || res.data?.body || res.data?.content;
        if (html && html.length > 200) return html;
        if (res.data?.error) throw new Error(`flaskresolver error: ${res.data.error}`);
      } catch (e: any) {
        // 404 = endpoint doesn't exist, try /v1 below; otherwise re-throw
        if (e?.response?.status !== 404 && !e?.message?.includes('ECONNREFUSED')) throw e;
      }

      // Strategy 2: FlareSolverr-compatible API (POST /v1)
      const res2 = await axios.post<FlareSolverrResponse>(
        `${FLARESOLVERR_URL}/v1`,
        { cmd: 'request.get', url, maxTimeout: CF_TIMEOUT_MS },
        { headers: { 'Content-Type': 'application/json' }, timeout: CF_TIMEOUT_MS + 5000 }
      );
      const html2 = res2.data?.solution?.response;
      if (html2 && html2.length > 200) return html2;

      throw new Error(`flaskresolver returned no usable HTML (status=${res2.data?.solution?.status})`);
    } finally {
      _inFlightCF.delete(url);
    }
  })();

  _inFlightCF.set(url, promise);
  return promise;
}
