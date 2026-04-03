<div align="center">

# 📓 NotebookCheck Scraper API

**A production-grade NotebookCheck + GSMArena scraper API — TypeScript, Express, Vercel**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

[Report Bug](https://github.com/Sanjeevu-Tarun/notebookchecker/issues) · [Request Feature](https://github.com/Sanjeevu-Tarun/notebookchecker/issues)

</div>

---

## What is this?

A production-ready REST API that scrapes **NotebookCheck** and **GSMArena** and returns rich, structured JSON — no API key, no signup, just hit the endpoint.

Built as a **Vercel serverless function** with a two-layer **Redis (Upstash) + in-memory** cache so repeat requests are sub-millisecond. NotebookCheck uses Cloudflare WAF, so the API ships with a **5-layer Cloudflare bypass cascade** — if your server IP gets flagged, it automatically fails over through ScraperAPI → Scrape.do → WebScrapingAPI → ZenRows → FlareSolverr with zero downtime.

### Why this over other NotebookCheck scrapers?

| Feature | This API | Most others |
|---------|----------|-------------|
| Cloudflare bypass (5-layer cascade) | ✅ | ❌ |
| Full benchmark extraction (CPU / GPU / memory / battery / thermal / audio / storage) | ✅ | ❌ |
| Smart variant-aware search (penalty scoring + hard-reject) | ✅ | ❌ |
| Classified image buckets (device / angles / camera samples / charts / display calibration) | ✅ | ❌ |
| Processor / SoC deep data (cores, clocks, GPU, NPU, process node) | ✅ | ❌ |
| Redis-backed crawl index (thousands of pre-scraped device URLs) | ✅ | ❌ |
| Per-stage debug + timing endpoints | ✅ | ❌ |
| SearXNG search fallback | ✅ | ❌ |
| GSMArena suggestions for autocomplete | ✅ | ❌ |
| Serverless (no server to maintain) | ✅ | ❌ |

---

## Try it now

Deploy your own instance first — it's free and takes 2 minutes:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sanjeevu-Tarun/notebookchecker)

Then hit your own deployment:

```bash
# Full device data
curl "https://YOUR-DEPLOYMENT.vercel.app/api/phone?q=samsung+galaxy+s25+ultra"

# Processor / SoC data
curl "https://YOUR-DEPLOYMENT.vercel.app/api/processor?q=snapdragon+8+elite"

# Search suggestions (via GSMArena)
curl "https://YOUR-DEPLOYMENT.vercel.app/api/phone/suggestions?q=pixel+9"

# Crawl index status
curl "https://YOUR-DEPLOYMENT.vercel.app/api/index/status"

# Health check
curl "https://YOUR-DEPLOYMENT.vercel.app/api/health"
```

> Each user runs on their own free Vercel account — no shared quota, no rate limit surprises.

---

## Quick Start

**Prerequisites:** [Node.js 18+](https://nodejs.org) and npm

```bash
# Clone and run
git clone https://github.com/Sanjeevu-Tarun/notebookchecker
cd notebookchecker
npm install
npm run dev
# → http://localhost:3000
```

> **How it works locally:** `npm run dev` starts a local Express server via `ts-node`. On Vercel, `module.exports = app` is used directly as the serverless handler — same codebase, zero config differences.

### Deploy to Vercel

```bash
npm install -g vercel
vercel deploy
```

`vercel.json` is already configured (60s max duration, `bom1` region) — no extra setup needed. Or use the one-click button at the top.

---

## Environment Variables

Optional — the API works without any keys using direct fetch with stealth headers. Add keys to unlock more resilience.

### Cloudflare Bypass Cascade

The cascade tries layers in order. If your server IP is clean, it goes direct (free). If blocked, it falls through to whichever keys you've added. As long as one layer works, everything works.

| Variable | Provider | Free Tier | Description |
|----------|----------|-----------|-------------|
| `SCRAPERAPI_KEY` | [scraperapi.com](https://scraperapi.com) | 1,000 req/month | Layer 1 — tried first |
| `SCRAPEDO_TOKEN` | [scrape.do](https://scrape.do) | 1,000 req/month | Layer 2 |
| `WEBSCRAPINGAPI_KEY` | [webscrapingapi.com](https://webscrapingapi.com) | 1,000 req/month | Layer 3 |
| `ZENROWS_KEY` | [zenrows.com](https://zenrows.com) | 1,000 req/month | Layer 4 |
| `FLARESOLVERR_URL` | Self-hosted / Render | Free | Layer 5 — last resort |

> You only need **one** key for this to work. Sign up for all four for maximum resilience — when one quota runs out, the next takes over automatically.

### Cache & Search

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `SEARXNG_URL` | Your SearXNG instance URL (for device search fallback) |

Get free Redis at [console.upstash.com](https://console.upstash.com) → create database → copy REST URL + token → add to Vercel project settings.

Get a free SearXNG instance at [searxng-notebookcheck.onrender.com](https://searxng-notebookcheck.onrender.com) or self-host one on Render's free tier.

---

## API Reference

<details>
<summary><b>📱 Device Data</b></summary>

### Get full device data
```
GET /api/phone?q=<device>
```

The primary endpoint. Resolution order: **full-result cache → Redis crawl index → SearXNG fallback**.

```bash
curl "https://YOUR-DEPLOYMENT.vercel.app/api/phone?q=samsung+galaxy+s25+ultra"
```
```json
{
  "success": true,
  "source": "index",
  "data": {
    "title": "Samsung Galaxy S25 Ultra",
    "subtitle": "Smartphone",
    "sourceUrl": "https://www.notebookcheck.net/...",
    "reviewUrl": "https://www.notebookcheck.net/...",
    "rating": "91%",
    "ratingLabel": "verdict",
    "verdict": "The Galaxy S25 Ultra is Samsung's best smartphone yet...",
    "author": "...",
    "publishDate": "2025-01-31",
    "pros": ["Outstanding display", "Excellent battery life"],
    "cons": ["No zoom improvement over S24 Ultra"],
    "soc": "Qualcomm Snapdragon 8 Elite",
    "gpu": "Adreno 830",
    "ram": "12 GB",
    "storage_capacity": "256",
    "storage_type": "UFS 4.0",
    "os": "Android 15",
    "price": "€1329",
    "releaseDate": "2025-01",
    "weight": "218 g",
    "dimensions": "162.8 x 77.6 x 8.2 mm",
    "display": {
      "Display": "6.9 inch AMOLED, 3088x1440, 500 PPI, 120 Hz",
      "technology": "AMOLED",
      "refreshRate": "120 Hz",
      "ppi": "500",
      "sRGB coverage": "99.9",
      "Brightness center (cd/m²)": "1058"
    },
    "battery": { "Capacity": "5000 mAh", "Runtime": "1432 min" },
    "cameras": {
      "lenses": [
        { "type": "main", "resolution": "200 MP", "aperture": "f/1.7" }
      ],
      "videoCapabilities": "8K@30fps, 4K@120fps"
    },
    "images": {
      "device": ["https://cdn.notebookcheck.net/..."],
      "deviceAngles": ["https://cdn.notebookcheck.net/..."],
      "cameraSamples": ["https://cdn.notebookcheck.net/..."],
      "screenshots": [],
      "charts": ["https://cdn.notebookcheck.net/..."],
      "displayMeasurements": [],
      "colorCalibration": ["https://cdn.notebookcheck.net/..."]
    },
    "benchmarks": {
      "cpu": [{ "name": "Geekbench 6 Multi", "value": "6952", "unit": "" }],
      "gpu": [{ "name": "3DMark Wild Life Extreme", "value": "4200", "unit": "" }],
      "battery": [{ "name": "Battery Life (WLAN)", "value": "1432", "unit": "min" }],
      "thermal": [{ "name": "Max Surface Temperature", "value": "40.5", "unit": "°C" }],
      "memory": [],
      "display": [],
      "storage": [],
      "networking": [],
      "audio": [],
      "other": []
    }
  }
}
```

> Search uses a **penalty scoring + hard-reject system** — querying `s25` won't return `s25+` or `s25 ultra` unless explicitly asked. Model suffix words (`xl`, `pro`, `plus`, `fold`, `ultra`, etc.) are treated as hard discriminators.

**Optional parameters:**

| Param | Value | Description |
|-------|-------|-------------|
| `q` | string | Device name (required) |
| `nocache` | `1` | Bypass all cache layers and re-scrape live |

</details>

<details>
<summary><b>🐛 Debug & Timing</b></summary>

### Per-stage debug
```
GET /api/phone/debug?q=<device>
```

Shows exactly which stage resolved the request and how long each took.

```bash
curl "https://YOUR-DEPLOYMENT.vercel.app/api/phone/debug?q=pixel+9+pro"
```
```json
{
  "query": "pixel 9 pro",
  "source": "index",
  "totalMs": 312,
  "timing": {
    "indexSearchMs": 14,
    "indexScrapeMs": 298
  },
  "cached": false,
  "indexMatch": {
    "url": "https://www.notebookcheck.net/Google-Pixel-9-Pro-Review...",
    "title": "Google Pixel 9 Pro"
  },
  "result": {
    "title": "Google Pixel 9 Pro",
    "rating": "90%",
    "hasBenchmarks": true,
    "hasSpecs": true,
    "imageCounts": {
      "device": 4,
      "cameraSamples": 18,
      "screenshots": 3,
      "charts": 9
    }
  }
}
```

### NBC direct search debug
```
GET /api/nbc/direct-debug?q=<device>
```

Shows raw NBC search HTML results, scoring, and timing — use this to verify NBC is reachable and returning sensible candidates before relying on automated search.

### SearXNG fallback debug
```
GET /api/nbc/searxng-debug?q=<device>
```

Shows exactly what SearXNG returns — raw links, scores, and which one wins.

</details>

<details>
<summary><b>🔍 Search & Suggestions</b></summary>

### GSMArena-powered suggestions
```
GET /api/phone/suggestions?q=<device>
```

Returns fast autocomplete-ready suggestions sourced from GSMArena's search, useful for building device pickers.

```bash
curl "https://YOUR-DEPLOYMENT.vercel.app/api/phone/suggestions?q=pixel+9"
```
```json
{
  "success": true,
  "source": "gsmarena",
  "data": [
    {
      "name": "Google Pixel 9",
      "slug": "google_pixel_9-12345",
      "imageUrl": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9.jpg"
    }
  ]
}
```

### NBC suggestions (SearXNG)
```
GET /api/nbc/suggestions?q=<device>
```

Returns suggestions directly from the SearXNG instance that indexes NotebookCheck, giving 2,190+ device options.

</details>

<details>
<summary><b>🔗 Scrape by URL</b></summary>

### Scrape a specific NBC device page
```
GET /api/nbc/device?url=<notebookcheck-url>
```

Scrapes any NotebookCheck review URL directly, bypassing search entirely. Useful when you already have the exact review URL.

```bash
curl "https://YOUR-DEPLOYMENT.vercel.app/api/nbc/device?url=https://www.notebookcheck.net/Samsung-Galaxy-S25-Ultra-Review.html"
```

### Scrape a specific GSMArena page
```
GET /api/phone/device?url=<gsmarena-url>
```

Same pattern for GSMArena device pages.

</details>

<details>
<summary><b>⚙️ Processor / SoC</b></summary>

Deep SoC data including CPU core clusters, clocks, GPU details, NPU TOPS, process node, and memory specs.

| Endpoint | Description |
|----------|-------------|
| `GET /api/processor?q=<chip>` | Full processor data by name |
| `GET /api/processor/suggestions?q=<chip>` | Autocomplete suggestions |
| `GET /api/processor/device?url=<notebookcheck-url>` | Scrape processor from a specific review |

```bash
curl "https://YOUR-DEPLOYMENT.vercel.app/api/processor?q=snapdragon+8+elite"
```
```json
{
  "success": true,
  "data": {
    "name": "Qualcomm Snapdragon 8 Elite",
    "manufacturer": "Qualcomm",
    "processNode": "TSMC 3nm",
    "cores": [
      { "name": "Oryon", "count": 2, "boostClockMHz": 4320, "isPerformanceCore": true },
      { "name": "Oryon", "count": 6, "boostClockMHz": 3530, "isEfficiencyCore": true }
    ],
    "gpu": {
      "name": "Adreno 830",
      "compute": "4.7 TFLOPS",
      "apis": ["OpenGL ES 3.2", "Vulkan 1.3", "DirectX 12"]
    },
    "npu": { "name": "Hexagon NPU", "tops": 45 },
    "memory": { "type": "LPDDR5X", "maxSpeedMHz": 4800 }
  }
}
```

</details>

<details>
<summary><b>📚 Crawl Index</b></summary>

The crawl index pre-fetches thousands of NotebookCheck device review URLs into Redis so `/api/phone` lookups resolve in milliseconds via a local search index — no live scraping required on each request.

| Endpoint | Description |
|----------|-------------|
| `GET /api/index/status` | Crawl progress, coverage stats, queue breakdown |
| `GET /api/index/crawl?maxPages=3` | Crawl N pages of NBC listings into the index |
| `GET /api/index/crawl-page?page=2` | Crawl a single listing page |
| `GET /api/index/validate?count=10` | Verify N random index URLs are still valid |
| `GET /api/index/list?status=pending&limit=20` | Browse indexed entries by status |
| `GET /api/index/scrape-one?url=<url>` | Scrape and cache one specific indexed device |
| `GET /api/index/search-debug?q=<device>` | Verify index hit/miss for a query |
| `GET /api/index/errors` | List entries that failed scraping |
| `GET /api/index/reset-errors` | Re-queue all errored entries for retry |
| `GET /api/index/brands` | Brand breakdown of the current index |
| `GET /api/index/rebuild-search` | Rebuild the fast in-memory search index from stored entries |
| `GET /api/index/clear` | ⚠️ Clear the entire crawl index |

```bash
# Check index coverage
curl https://YOUR-DEPLOYMENT.vercel.app/api/index/status
```
```json
{
  "total": 4821,
  "scraped": 3104,
  "pending": 1717,
  "errors": 0,
  "coverage": "64.4%"
}
```

> **Recommended setup:** Run `/api/index/crawl?maxPages=20` once after deployment to seed the index, then use [UptimeRobot](https://uptimerobot.com) (free) to ping `/api/nbc/keepalive` every 10 minutes to keep the SearXNG instance warm on Render's free tier.

</details>

---

## Image Buckets

Every device response includes a fully classified `images` object. Images are sorted into buckets based on filename patterns, section context, and caption analysis — not guesswork.

| Bucket | Contents |
|--------|----------|
| `device` | Hero product shots, color variant photos |
| `deviceAngles` | Hardware detail shots — top, bottom, left, right, ports, buttons, SIM tray |
| `cameraSamples` | Photos **taken by** the phone — main / ultra-wide / tele / zoom / night / selfie |
| `screenshots` | OS and UI screenshots |
| `charts` | GNSS tracks, battery discharge plots, camera resolution charts |
| `displayMeasurements` | Oscilloscope PWM waveforms |
| `colorCalibration` | Calman colour accuracy plots, colour space coverage, greyscale charts |

---

## Benchmark Categories

Every device response includes a `benchmarks` object with results categorised automatically:

| Category | Examples |
|----------|---------|
| `cpu` | Geekbench 6, AnTuTu, PCMark |
| `gpu` | 3DMark Wild Life, GFXBench, Manhattan |
| `memory` | Storage read/write speeds |
| `display` | Brightness (cd/m²), contrast, colour accuracy (ΔE), PWM frequency |
| `battery` | WLAN runtime (min), video playback, idle |
| `storage` | Sequential read/write, random IOPS |
| `networking` | Wi-Fi throughput |
| `thermal` | Max surface temperature (°C) |
| `audio` | Max volume (dB), frequency response |
| `other` | Anything that doesn't fit the above |

---

## Caching

| Layer | Storage | TTL | Behaviour |
|-------|---------|-----|-----------|
| 1st | In-memory Map (500 entries) | Permanent (LRU eviction) | Always checked first, zero latency |
| 2nd | Redis via Upstash | Permanent (no EX) | Checked on memory miss, survives cold starts forever |

Cache keys are schema-versioned (e.g. `nbc:phone-full:v2:...`) — bumping the version in code instantly invalidates all stale data with no manual flush needed. A checksum of the `NBCDeviceData` field list is computed at startup so any change to the data shape auto-increments the cache key.

---

## Cloudflare Bypass Architecture

NotebookCheck uses Cloudflare WAF that blocks datacenter IPs. The bypass cascade works like this:

```
Request
  │
  ▼
Layer 0: Direct fetch with randomised stealth headers + User-Agent rotation
  │ (blocked / 403)
  ▼
Layer 1: ScraperAPI               ← 1,000 free req/month
  │ (quota exhausted / error)
  ▼
Layer 2: Scrape.do                ← 1,000 free req/month
  │
  ▼
Layer 3: WebScrapingAPI           ← 1,000 free req/month
  │
  ▼
Layer 4: ZenRows                  ← 1,000 free req/month
  │
  ▼
Layer 5: FlareSolverr / Flask     ← your existing Render service
```

Each layer is tried in order. Unused layers (no env var set) are skipped gracefully. The result is ~4,000 free bypass requests per month combined — more than enough for personal or low-traffic production use.

---

## Project Structure

```
├── index.ts                          # Express routes + Vercel handler + local dev server
└── src/
    ├── flaresolverr.ts               # 5-layer Cloudflare bypass cascade
    ├── gsmarena.ts                   # GSMArena search + device scraper
    ├── notebookcheck.ts              # Core NBC scraper — specs, benchmarks, images, cameras
    ├── notebookcheck_index.ts        # Crawl index — Redis-backed URL store + search index
    └── notebookcheck_processor.ts    # Processor / SoC scraper — cores, GPU, NPU, memory
```

---

## Contributing

Issues and PRs are welcome! For major changes please open an issue first.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature"
git push origin feature/your-feature
# open a PR
```

---

## ⚠️ Disclaimer

This project scrapes publicly accessible pages for personal and educational use. It is not affiliated with NotebookCheck or GSMArena. Use responsibly and respect their terms of service.

---

## ⭐ Support

If this project helped you, consider giving it a star — it helps others discover it!

[![Star this repo](https://img.shields.io/github/stars/Sanjeevu-Tarun/notebookchecker?style=social)](https://github.com/Sanjeevu-Tarun/notebookchecker)

- 🐛 [Report a bug](https://github.com/Sanjeevu-Tarun/notebookchecker/issues)
- 💡 [Request a feature](https://github.com/Sanjeevu-Tarun/notebookchecker/issues)
- 👤 [Follow me on GitHub](https://github.com/Sanjeevu-Tarun) for more projects like this ❤️
- ❤️ Thanks for your support

---

## 📄 License

[MIT](./LICENSE) © 2026 — Made with ❤️ by [Sanjeevu-Tarun](https://github.com/Sanjeevu-Tarun)
