import axios from 'axios';

// URL of your FlareSolverr instance on Render
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL || 'https://flaresolverr-xxxx.onrender.com';

interface FlareSolverrResponse {
  solution: {
    url: string;
    status: number;
    response: string;
    cookies: Array<{ name: string; value: string }>;
    userAgent: string;
  };
}

// ── IN-FLIGHT REQUEST DEDUPLICATION ─────────────────────────────────────────
// Prevents multiple simultaneous callers from firing duplicate requests to
// FlareSolverr for the same URL (observed in logs: same URL sent 3× in 1s,
// causing 3 parallel Chrome tabs to attempt the same CF challenge).
// When a fetch for URL X is already in-flight, subsequent callers await the
// same Promise instead of spawning a new browser tab in FlareSolverr.
const _inFlightCF = new Map<string, Promise<string>>();

// Ask FlareSolverr to fetch a URL — it solves CF and returns HTML + cookies
export async function fetchWithCF(url: string): Promise<string> {
  // Deduplicate: if a request for this URL is already in-flight, reuse it
  const existing = _inFlightCF.get(url);
  if (existing) return existing;

  const promise = (async (): Promise<string> => {
    try {
      const res = await axios.post<FlareSolverrResponse>(
        `${FLARESOLVERR_URL}/v1`,
        {
          cmd: 'request.get',
          url: url,
          // FIX: was 20000ms — notebookcheck.net Cloudflare challenge takes
          // 20-40s on shared Render IPs (confirmed by log: "Timeout after 20.0 seconds").
          // Set to 60s to match FlareSolverr's own default and give enough headroom.
          maxTimeout: 60000,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data?.solution?.response) {
        return res.data.solution.response;
      }
      throw new Error('FlareSolverr returned no response');
    } finally {
      // Always clean up so future calls can retry fresh after success or failure
      _inFlightCF.delete(url);
    }
  })();

  _inFlightCF.set(url, promise);
  return promise;
}
