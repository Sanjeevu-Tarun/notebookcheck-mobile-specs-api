import axios from 'axios';

// ══════════════════════════════════════════════════════════════════════════════
//  CLOUDFLARE BYPASS — MULTI-LAYER INFINITE CASCADE
//  ─────────────────────────────────────────────────────────────────────────────
//  Problem: notebookcheck.net uses Cloudflare WAF that blocks server IPs.
//  Render free-tier IPs get flagged randomly. "flaskresolver" (plain Python
//  requests) cannot bypass JS challenges — it gets 403 too.
//
//  Solution: cascade through multiple independent bypass providers. Each has a
//  free tier. As long as at least one works, requests succeed. When one fails
//  (blocked, quota exhausted, down) the next is tried automatically.
//
//  LAYER ORDER (fastest/cheapest first):
//    0. Direct fetch with stealth headers       — free, works when IP is clean
//    1. ScraperAPI                              — 1000 req/month free
//    2. Scrape.do                               — 1000 req/month free
//    3. WebScrapingAPI                          — 1000 req/month free
//    4. ZenRows                                 — 1000 req/month free
//    5. Legacy flaskresolver / FlareSolverr     — your existing Render service
//
//  ENV VARS (add whichever you have — unused layers are skipped gracefully):
//    SCRAPERAPI_KEY          → scraperapi.com (free signup)
//    SCRAPEDO_TOKEN          → scrape.do (free signup)
//    WEBSCRAPINGAPI_KEY      → webscrapingapi.com (free signup)
//    ZENROWS_KEY             → zenrows.com (free signup)
//    FLARESOLVERR_URL        → your existing flaskresolver on Render
//
//  You only need ONE key for this to work. Sign up for all four for maximum
//  resilience — when one quota runs out, the next takes over automatically.
// ══════════════════════════════════════════════════════════════════════════════

const CF_TIMEOUT_MS = 25000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];
const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

function stealthHeaders(ua: string) {
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'dnt': '1',
  };
}

// A response is "good" if it has real HTML — not a Cloudflare challenge page.
function isGoodHtml(html: unknown): html is string {
  if (typeof html !== 'string' || html.length < 500) return false;
  if (/<title>.*?Just a moment.*?<\/title>/i.test(html)) return false;
  if (/cf-browser-verification|cf_clearance|cloudflare-static/i.test(html) && html.length < 5000) return false;
  return html.includes('<html') || html.includes('<!DOCTYPE') || html.includes('<body');
}

// ── LAYER 0: DIRECT FETCH ─────────────────────────────────────────────────────
async function tryDirect(url: string): Promise<string | null> {
  try {
    const { data } = await axios.get(url, {
      headers: stealthHeaders(randomUA()),
      timeout: 10000,
      maxRedirects: 5,
      decompress: true,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return isGoodHtml(html) ? html : null;
  } catch {
    return null;
  }
}

// ── LAYER 1: SCRAPERAPI ───────────────────────────────────────────────────────
// scraperapi.com — 1000 free req/month
async function tryScraperAPI(url: string): Promise<string | null> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return null;
  try {
    const { data } = await axios.get('https://api.scraperapi.com', {
      params: { api_key: key, url, render: 'false', country_code: 'us', device_type: 'desktop' },
      timeout: CF_TIMEOUT_MS,
      decompress: true,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return isGoodHtml(html) ? html : null;
  } catch (e: any) {
    if (e?.response?.status === 401 || e?.response?.status === 403) {
      console.warn('[bypass] ScraperAPI: quota/auth issue');
    }
    return null;
  }
}

// ── LAYER 2: SCRAPE.DO ────────────────────────────────────────────────────────
// scrape.do — 1000 free req/month
async function tryScrapeDo(url: string): Promise<string | null> {
  const token = process.env.SCRAPEDO_TOKEN;
  if (!token) return null;
  try {
    const { data } = await axios.get('https://api.scrape.do', {
      params: { token, url, geoCode: 'us', super: 'false' },
      timeout: CF_TIMEOUT_MS,
      decompress: true,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return isGoodHtml(html) ? html : null;
  } catch (e: any) {
    if (e?.response?.status === 401) console.warn('[bypass] Scrape.do: quota/auth issue');
    return null;
  }
}

// ── LAYER 3: WEBSCRAPINGAPI ───────────────────────────────────────────────────
// webscrapingapi.com — 1000 free req/month
async function tryWebScrapingAPI(url: string): Promise<string | null> {
  const key = process.env.WEBSCRAPINGAPI_KEY;
  if (!key) return null;
  try {
    const { data } = await axios.get('https://api.webscrapingapi.com/v1', {
      params: { api_key: key, url, render_js: '0', country: 'us' },
      timeout: CF_TIMEOUT_MS,
      decompress: true,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return isGoodHtml(html) ? html : null;
  } catch (e: any) {
    if (e?.response?.status === 401 || e?.response?.status === 403) {
      console.warn('[bypass] WebScrapingAPI: quota/auth issue');
    }
    return null;
  }
}

// ── LAYER 4: ZENROWS ──────────────────────────────────────────────────────────
// zenrows.com — 1000 free req/month
async function tryZenRows(url: string): Promise<string | null> {
  const key = process.env.ZENROWS_KEY;
  if (!key) return null;
  try {
    const { data } = await axios.get('https://api.zenrows.com/v1/', {
      params: { apikey: key, url, js_render: 'false', antibot: 'true' },
      timeout: CF_TIMEOUT_MS,
      decompress: true,
    });
    const html = typeof data === 'string' ? data : JSON.stringify(data);
    return isGoodHtml(html) ? html : null;
  } catch (e: any) {
    if (e?.response?.status === 422 || e?.response?.status === 401) {
      console.warn('[bypass] ZenRows: quota/auth issue');
    }
    return null;
  }
}

// ── LAYER 5: LEGACY FLASKRESOLVER / FLARESOLVERR ─────────────────────────────
interface FlaskResolverResponse { html?: string; body?: string; content?: string; status?: number; error?: string; }
interface FlareSolverrResponse  { solution?: { response?: string; status?: number }; status?: string; }

async function tryFlaskResolver(url: string): Promise<string | null> {
  const base = process.env.FLARESOLVERR_URL;
  if (!base) return null;
  try {
    try {
      const res = await axios.post<FlaskResolverResponse>(
        `${base}/solve`, { url },
        { headers: { 'Content-Type': 'application/json' }, timeout: CF_TIMEOUT_MS },
      );
      const html = res.data?.html || res.data?.body || res.data?.content;
      if (isGoodHtml(html)) return html!;
      if (res.data?.error) throw new Error(res.data.error);
    } catch (e: any) {
      if (e?.response?.status !== 404 && !e?.message?.includes('ECONNREFUSED')) throw e;
    }
    const res2 = await axios.post<FlareSolverrResponse>(
      `${base}/v1`,
      { cmd: 'request.get', url, maxTimeout: CF_TIMEOUT_MS },
      { headers: { 'Content-Type': 'application/json' }, timeout: CF_TIMEOUT_MS + 5000 },
    );
    const html2 = res2.data?.solution?.response;
    return isGoodHtml(html2) ? html2! : null;
  } catch {
    return null;
  }
}

// ── PROVIDER HEALTH / CIRCUIT BREAKER ────────────────────────────────────────
const _failures: Record<string, number> = {};
const _lastSuccess: Record<string, number> = {};
const CIRCUIT_OPEN_AFTER = 3;
const CIRCUIT_RESET_MS   = 5 * 60 * 1000; // 5 minutes

function isCircuitOpen(name: string): boolean {
  if ((_failures[name] ?? 0) < CIRCUIT_OPEN_AFTER) return false;
  if (Date.now() - (_lastSuccess[name] ?? 0) > CIRCUIT_RESET_MS) {
    _failures[name] = 0;
    return false;
  }
  return true;
}
function recordSuccess(name: string) { _failures[name] = 0; _lastSuccess[name] = Date.now(); }
function recordFailure(name: string) { _failures[name] = (_failures[name] ?? 0) + 1; }

// ── IN-FLIGHT DEDUPLICATION ───────────────────────────────────────────────────
const _inFlight = new Map<string, Promise<string>>();

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export async function fetchWithCF(url: string): Promise<string> {
  const existing = _inFlight.get(url);
  if (existing) return existing;

  const promise = (async (): Promise<string> => {
    try {
      const layers: Array<{ name: string; fn: (u: string) => Promise<string | null> }> = [
        { name: 'direct',         fn: tryDirect         },
        { name: 'scraperapi',     fn: tryScraperAPI     },
        { name: 'scrapedo',       fn: tryScrapeDo       },
        { name: 'webscrapingapi', fn: tryWebScrapingAPI },
        { name: 'zenrows',        fn: tryZenRows        },
        { name: 'flaskresolver',  fn: tryFlaskResolver  },
      ];

      for (const layer of layers) {
        if (isCircuitOpen(layer.name)) {
          console.info(`[bypass] ${layer.name}: circuit open — skipping`);
          continue;
        }
        try {
          console.info(`[bypass] trying ${layer.name} for ${url}`);
          const html = await layer.fn(url);
          if (html) {
            recordSuccess(layer.name);
            console.info(`[bypass] ${layer.name}: SUCCESS (${html.length} bytes)`);
            return html;
          }
          recordFailure(layer.name);
          console.info(`[bypass] ${layer.name}: no usable HTML`);
        } catch (e: any) {
          recordFailure(layer.name);
          console.warn(`[bypass] ${layer.name}: threw — ${e?.message}`);
        }
      }

      throw new Error(
        'All bypass layers failed. Add at least one API key: ' +
        'SCRAPERAPI_KEY, SCRAPEDO_TOKEN, WEBSCRAPINGAPI_KEY, or ZENROWS_KEY'
      );
    } finally {
      _inFlight.delete(url);
    }
  })();

  _inFlight.set(url, promise);
  return promise;
}

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
export async function pingFlaskResolver(): Promise<boolean> {
  const configured: string[] = [];
  if (process.env.SCRAPERAPI_KEY)     configured.push('ScraperAPI');
  if (process.env.SCRAPEDO_TOKEN)     configured.push('Scrape.do');
  if (process.env.WEBSCRAPINGAPI_KEY) configured.push('WebScrapingAPI');
  if (process.env.ZENROWS_KEY)        configured.push('ZenRows');
  if (process.env.FLARESOLVERR_URL)   configured.push('FlaskResolver');

  console.info(`[bypass] Configured providers: ${configured.length ? configured.join(', ') : 'none (direct-only mode)'}`);

  const base = process.env.FLARESOLVERR_URL;
  if (base) {
    try {
      const res = await axios.get(`${base}/health`, { timeout: 8000 });
      return res.status === 200;
    } catch {
      try {
        const res = await axios.get(base, { timeout: 8000 });
        return res.status < 500;
      } catch { return false; }
    }
  }
  return configured.length > 0;
}
