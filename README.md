<div align="center">

# 📓 NotebookCheck Scraper API
### The only open-source API that turns NotebookCheck reviews into structured JSON — with Cloudflare bypass, 7-bucket image classification, full benchmarks, and a 4,000+ device crawl index

**Full review scraping · 7-bucket image classification · 10-category benchmarks · SoC deep data · 5-layer Cloudflare bypass · 3-source crawl index · Two-layer cache · Deploy in 2 minutes**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![Vercel](https://img.shields.io/badge/Deploy%20on-Vercel-black?logo=vercel)](https://vercel.com/)

[🚀 Deploy Now](#deploy-to-vercel) · [📖 API Reference](#api-reference) · [🐛 Report Bug](../../issues) · [💡 Request Feature](../../issues)

</div>

---

## Table of Contents

- [Why This API?](#why-this-api)
- [Features](#features)
- [Quick Start](#quick-start)
  - [Deploy to Vercel](#deploy-to-vercel)
  - [Sample JSON Output](#sample-json-output)
- [API Reference](#api-reference)
  - [Device Data](#device-data)
  - [Processor / SoC](#processor--soc)
  - [Search & Suggestions](#search--suggestions)
  - [Scrape by URL](#scrape-by-url)
  - [Debug & Timing](#debug--timing)
  - [Crawl Index](#crawl-index)
  - [Browser Dashboards](#browser-dashboards)
  - [Error Schema](#error-schema)
- [Image Buckets](#image-buckets)
- [Benchmark Categories](#benchmark-categories)
- [Cloudflare Bypass Architecture](#cloudflare-bypass-architecture)
- [Caching](#caching)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [Disclaimer](#️-disclaimer)
- [License](#license)

---

## Why This API?

NotebookCheck is the most thorough independent smartphone review site on the web — oscilloscope PWM measurements, Calman colour calibration plots, 10-category benchmark suites, per-lens camera specs with sensor sizes and OIS types, structured pros/cons, and hundreds of classified camera samples per review. No other site publishes this depth of data in a machine-readable form.

The problem: NotebookCheck sits behind Cloudflare WAF, serves everything as HTML, and changes its markup without notice. Getting that data out reliably requires solving three things at once:

1. **Cloudflare bypass** — datacenter IPs get 403'd. The API ships a 5-layer cascade that automatically fails over through ScraperAPI → Scrape.do → WebScrapingAPI → ZenRows → FlareSolverr with zero downtime.
2. **Image classification** — NBC review pages mix product shots, angle shots, camera samples, screenshots, benchmark charts, oscilloscope traces, and Calman plots in a single undifferentiated image pool. The API sorts them into 7 typed buckets using a multi-pass filename/caption/section-context classifier with 9 named fixes for real-world edge cases.
3. **Scale** — scraping live on every request doesn't work. The API maintains a Redis-backed crawl index of 4,000+ device review URLs across three independent NBC listing sources, so most requests resolve from index in milliseconds without a live scrape.

---

## Features

| Feature | This API | Most others |
|---|---|---|
| 5-layer Cloudflare bypass cascade | ✅ | ❌ |
| 7-bucket image classification (device / angles / camera samples / screenshots / charts / display measurements / colour calibration) | ✅ | ❌ |
| 10-category benchmarks (CPU / GPU / memory / display / battery / storage / networking / thermal / audio / other) | ✅ | ❌ |
| Per-lens camera specs (sensor, size, aperture, OIS type, CIPA stabilization, zoom, AF) | ✅ | ❌ |
| Display deep data (brightness, contrast, ΔE, gamma, CCT, PWM frequency) | ✅ | ❌ |
| Processor / SoC deep data (cores, clocks, GPU, NPU, process node, memory type) | ✅ | ❌ |
| Smart variant-aware search (penalty scoring + hard-reject) | ✅ | ❌ |
| 3-source crawl index with 4,000+ device review URLs | ✅ | ❌ |
| Redis-backed cache with schema-versioned keys | ✅ | ❌ |
| Per-stage debug + timing endpoints | ✅ | ❌ |
| NBC TYPO3 POST search (direct, no SearXNG dependency) | ✅ | ❌ |
| GSMArena suggestions for autocomplete | ✅ | ❌ |
| Interactive browser dashboards (/migrate, /recover, /recrawl) | ✅ | ❌ |
| Fully CORS-enabled for direct frontend consumption | ✅ | ❌ |
| Serverless — no infrastructure to manage | ✅ | ❌ |

---

## Quick Start

**Prerequisites:** Node.js 18+ · npm

```bash
git clone https://github.com/Sanjeevu-Tarun/notebookchecker
cd notebookchecker
npm install
cp .env.example .env        # copy env template — fill in keys before first run
npm run dev
# → http://localhost:3000
```

> `npm run dev` starts a local Express server via `ts-node`. On Vercel, `module.exports = app` is used directly as the serverless handler — same codebase, zero config differences.

> **CORS:** The API is fully CORS-enabled out of the box. Hit any endpoint directly from a browser, a frontend app, or a mobile WebView — no proxy required.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Sanjeevu-Tarun/notebookchecker)

Or via CLI:

```bash
npm install -g vercel
vercel deploy
```

`vercel.json` is pre-configured (60s max duration, `bom1` region). Zero extra setup required.

---

### Sample JSON Output

This is real output from the API for the **Vivo X300 Pro**. Not mocked — not fabricated.

<details>
<summary><strong>▶ Expand full Vivo X300 Pro JSON response</strong></summary>

```json
{
  "success": true,
  "source": "full-cache",
  "data": {
    "title": "More than just an unusual camera setup - Vivo X300 Pro review",
    "subtitle": "Champion with potential.",
    "rating": "88%",
    "ratingLabel": "very good",
    "verdict": "The Vivo X300 Pro is a flagship camera smartphone with virtually uncompromising features, aimed primarily at photo and video enthusiasts. Its combination of a versatile triple camera setup, great low-light performance, superb video flexibility including 8K recording, and excellent stabilization clearly puts the device's focus on mobile imaging.",
    "author": "Daniel Schmidt - Managing Editor Mobile - 857 articles published on Notebookcheck since 2013",
    "publishDate": "2025-12-14 15:26",
    "pros": [
      "powerful camera setup",
      "bright and accurate LTPO panel",
      "high performance",
      "IP69 certified",
      "fast charging",
      "36-month warranty"
    ],
    "cons": [
      "no UWB",
      "average speakers",
      "throttling",
      "no barometer"
    ],
    "soc": "MediaTek Dimensity 9500 8c/8t, 1 x 4.2 GHz ARM C1-Ultra, 3 x 3.5 GHz ARM C1-Premium, 4 x 2.7 GHz ARM C1-Pro",
    "gpu": "Arm Mali G1-Ultra MC12",
    "ram": "16 GB",
    "storage_capacity": "512 GB",
    "storage_type": "UFS 4.1",
    "os": "Android 16",
    "price": "€1399",
    "releaseDate": "2025-12-14",
    "weight": "226 g",
    "dimensions": "7.99 x 161.98 x 75.48 mm",
    "ipRating": "IP68/IP69",
    "bluetooth": "6.0",
    "wifi": "a/b/g/n/ac/ax/be",
    "nfc": "Yes",
    "gnss": "GPS (L1, L5), Glonass (L1), BeiDou (B1I, B1C, B2a), Galileo (E1, E3a, E5b), QZSS (L1, L5), NavIC (L5), SBAS",
    "hdr": "HLG, HDR10, HDR10+, Dolby Vision",
    "drm": "Widevine L1",
    "maxChargingSpeed": "90 W",
    "warrantyMonths": "36",
    "hasWalkieTalkie": true,
    "hasIRBlaster": true,
    "speakers": "Dual",

    "display": {
      "technology": "AMOLED",
      "sizeInch": "6.78",
      "ppi": "453",
      "refreshRate": "120 Hz",
      "glass": "Armor Glass",
      "Brightness center (cd/m²)": "1609",
      "Brightness max (cd/m²)": "1609",
      "Brightness avg (cd/m²)": "1562.1",
      "Brightness min (cd/m²)": "1.35",
      "Brightness distribution (%)": "93",
      "Contrast": "∞:1 (Black: 0 cd/m²)",
      "ΔE ColorChecker": "1.3",
      "ΔE Greyscale": "2",
      "sRGB coverage": "99.7",
      "Gamma": "2.26",
      "CCT (K)": "6709",
      "PWM frequency": "360 Hz"
    },

    "battery": {
      "capacityMah": "5440",
      "capacityWh": "19.75",
      "technology": "Lithium-Ion",
      "wiredW": "90",
      "wirelessW": "40"
    },

    "cameras": {
      "lenses": [
        {
          "type": "main",
          "megapixels": "50 MP",
          "sensor": "LYT-828",
          "sensorSize": "1/1.28\"",
          "aperture": "f/1.57",
          "ois": true,
          "oisType": "Gimbal-OIS",
          "cipaStabilization": "5.5",
          "af": false,
          "description": "50 MPix (LYT-828, 1/1.28\", f/1.57, Cipa 5.5, Gimbal-OIS)"
        },
        {
          "type": "ultrawide",
          "megapixels": "50 MP",
          "sensor": "JN1",
          "sensorSize": "1/2.76\"",
          "aperture": "f/2.0",
          "ois": false,
          "af": true,
          "description": "50 MPix (JN1, Ultra wide, 1/2.76\", f/2.0, AF)"
        },
        {
          "type": "telephoto",
          "megapixels": "200 MP",
          "sensorSize": "1/1.4\"",
          "aperture": "f/2.7",
          "opticalZoom": "3.7x",
          "ois": true,
          "oisType": "OIS",
          "af": false,
          "description": "200 MPix (3.7x Tele, 1/1.4\", f/2.7, OIS)"
        }
      ],
      "selfie": {
        "type": "selfie",
        "megapixels": "50 MP",
        "sensor": "JN1",
        "sensorSize": "1/2.76\"",
        "aperture": "f/2.0",
        "af": true
      },
      "videoCapabilities": "8K@30fps, 4K@120fps",
      "camera2ApiLevel": "Level 3"
    },

    "images": {
      "device": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-0002.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1769.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1770.jpg"
      ],
      "deviceAngles": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1774.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1771.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1772.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/aPic_Vivo_X300_Pro-1773.jpg"
      ],
      "cameraSamples": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_Rabbit.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_Lake.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_Ultrawide.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_Zoom5x.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_LowLight.jpg"
      ],
      "screenshots": [
        "https://www.notebookcheck.net/fileadmin/_processed_/webp/Notebooks/Vivo/X300_Pro/Screenshot_20251209_105458-q82-w-h1600.webp",
        "https://www.notebookcheck.net/fileadmin/_processed_/webp/Notebooks/Vivo/X300_Pro/Screenshot_20251209_105505-q82-w-h1600.webp"
      ],
      "charts": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/GNSS_Vivo_X300_Pro_Lake.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/GNSS_Vivo_X300_Pro_City.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Photo_X300Pro_Chart.jpg"
      ],
      "displayMeasurements": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS14.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS15.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS16.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS17.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS18.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/RigolDS20.jpg"
      ],
      "colorCalibration": [
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Calman_Natural_Standard_Grayscale_sRGB.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Calman_Natural_Standard_ColorChecker_sRGB.jpg",
        "https://www.notebookcheck.net/fileadmin/Notebooks/Vivo/X300_Pro/Calman_Natural_Standard_Colorspace_sRGB.jpg"
      ]
    },

    "benchmarks": {
      "cpu": [
        { "name": "Geekbench 6.5 / Single-Core",     "value": "3562",    "unit": "Points" },
        { "name": "Geekbench 6.5 / Multi-Core",      "value": "10615",   "unit": "Points" },
        { "name": "Antutu v10 - Total Score",         "value": "3095982", "unit": "Points" },
        { "name": "PCMark for Android - Work 3.0",   "value": "17480",   "unit": "Points" },
        { "name": "Geekbench AI / Quantized NPU 1.7","value": "1631",    "unit": "Points" }
      ],
      "gpu": [
        { "name": "3DMark / Wild Life Extreme",                  "value": "7582",  "unit": "Points" },
        { "name": "3DMark / Wild Life Stress Test Stability",    "value": "52.3",  "unit": "%" },
        { "name": "3DMark / Solar Bay Score",                    "value": "14869", "unit": "Points" },
        { "name": "GFXBench / Aztec Ruins High Tier Offscreen",  "value": "120",   "unit": "fps" },
        { "name": "BaseMark OS II / Graphics",                   "value": "26660", "unit": "Points" }
      ],
      "display": [
        { "name": "Display / APL18 Peak Brightness",  "value": "2329",                    "unit": "cd/m²" },
        { "name": "Display / HDR Peak Brightness",    "value": "2785",                    "unit": "cd/m²" },
        { "name": "Colorchecker dE 2000 *",           "value": "1.3",                     "unit": "" },
        { "name": "Screen flickering / PWM detected", "value": "360 Hz Amplitude: 14.29 %","unit": "%" }
      ],
      "battery": [
        { "name": "Battery runtime - WiFi v1.3",     "value": "17.9", "unit": "h" },
        { "name": "Battery runtime - Reader / Idle", "value": "39.8", "unit": "h" },
        { "name": "Battery runtime - Load",          "value": "2.9",  "unit": "h" }
      ],
      "storage": [
        { "name": "Sequential Read 256KB (MB/s)",  "value": "2041.82", "unit": "" },
        { "name": "Sequential Write 256KB (MB/s)", "value": "1981.85", "unit": "" },
        { "name": "Random Read 4KB (MB/s)",        "value": "320.25",  "unit": "" },
        { "name": "Random Write 4KB (MB/s)",       "value": "593.74",  "unit": "" }
      ],
      "networking": [
        { "name": "iperf3 transmit AXE11000 6GHz", "value": "1866", "unit": "MBit/s", "minValue": "1793" },
        { "name": "iperf3 receive AXE11000 6GHz",  "value": "1806", "unit": "MBit/s", "minValue": "1725" }
      ],
      "memory":  [],
      "thermal": [],
      "audio":   [],
      "other": [
        { "name": "UL Procyon AI Inference - Overall Score NNAPI", "value": "19373", "unit": "Points" },
        { "name": "WebXPRT 4 - Overall",                          "value": "255",   "unit": "Points" }
      ]
    }
  }
}
```

> The snippet above is abbreviated for readability. The full Vivo X300 Pro response includes 30+ GPU benchmark rows across GFXBench / 3DMark / BaseMark, 16 OS screenshots, 8 oscilloscope PWM waveforms (RigolDS12–RigolDS20), 5 Calman colour calibration plots, and 12 device photos correctly separated from 4 hardware angle shots — all from a single endpoint call.

</details>

---

## API Reference

### Device Data

```bash
GET /api/phone?q=vivo+x300+pro
```

The primary endpoint. Resolution order: **full-result cache → Redis crawl index → live scrape**. Returns the complete device object: review metadata, specs, rating, verdict, pros/cons, cameras, display deep data, benchmarks, and classified images.

**Optional parameters:**

| Param | Value | Description |
|-------|-------|-------------|
| `q` | string | Device name (required) |
| `nocache` | `1` | Bypass all cache layers and re-scrape live |

> Search uses a **penalty scoring + hard-reject system** — querying `s25` won't return `s25+` or `s25 ultra` unless explicitly asked. Model suffix words (`xl`, `xr`, `se`, `5g`, `4g`, `go`, `compact`, `slim`, `zoom`, `plus`, `fold`, `flip`, `ultra`) are treated as hard discriminators: a result that has one and the query doesn't (or vice versa) is hard-rejected rather than just penalised.

---

### Processor / SoC

Deep SoC data including CPU core clusters, clocks, GPU, NPU, connectivity, process node, memory type — plus per-benchmark scores with percentile rankings and per-device score breakdowns showing exactly which phones were tested with this chip.

```bash
GET /api/processor?q=snapdragon+8+elite
```

<details>
<summary><strong>▶ Expand full Snapdragon 8 Elite JSON response</strong></summary>

```json
{
  "success": true,
  "source": "notebookcheck",
  "data": {
    "name": "Qualcomm Snapdragon 8 Elite",
    "manufacturer": "Qualcomm",
    "category": "Processor",
    "series": "Qualcomm Snapdragon 8",
    "description": "The Snapdragon 8 Elite (SM8750-AB) is a high-end SoC for flagship smartphones and tablets in 2025 and the top product from the US manufacturer.",
    "performanceTier": "Flagship",
    "architecture": "ARM",
    "processNode": "3 nm",
    "announcedDate": "10/23/2024",
    "codename": "Oryon v2",
    "totalCores": 8,
    "totalThreads": 8,
    "baseClockMHz": 3500,
    "boostClockMHz": 4300,
    "l2CacheTotal": "12 MB",
    "l3Cache": "8 MB",

    "cpuClusters": [
      {
        "name": "Qualcomm Oryon Gen 2 Prime",
        "count": 2,
        "baseClockMHz": 4300,
        "boostClockMHz": 4300,
        "isPerformanceCore": true,
        "isEfficiencyCore": false
      },
      {
        "name": "Qualcomm Oryon Gen 2 Performance",
        "count": 6,
        "baseClockMHz": 3500,
        "boostClockMHz": 3500,
        "isPerformanceCore": true,
        "isEfficiencyCore": false
      }
    ],

    "gpu": {
      "name": "Qualcomm Adreno 830",
      "maxClockMHz": 1100
    },
    "npu": { "name": "Hexagon" },
    "memory": { "type": "LPDDR5X", "speedMHz": "4800 MHz" },
    "connectivity": {
      "wifi": "Wi-Fi 7",
      "cellular": "X80 5G Modem",
      "cellularBands": "Sub-6 GHz, mmWave"
    },
    "media": { "isp": "Spectra ISP" },

    "seriesProcessors": [
      {
        "name": "Qualcomm Snapdragon 8 Elite for Galaxy",
        "url": "https://www.notebookcheck.net/Qualcomm-Snapdragon-8-Elite-for-Galaxy-...",
        "isCurrent": false
      },
      { "name": "Qualcomm Snapdragon 8 Elite", "isCurrent": true }
    ],

    "benchmarks": [
      {
        "name": "Geekbench 6.6 Single-Core",
        "value": "3047",
        "unit": "points",
        "category": "cpu",
        "minValue": "2309",
        "maxValue": "3228",
        "percentile": "71",
        "deviceScores": [
          { "model": "Xiaomi Poco F7 Ultra",                       "score": "2309" },
          { "model": "Realme GT7 Pro",                             "score": "2847" },
          { "model": "OnePlus 13",                                 "score": "3087" },
          { "model": "Asus ROG Phone 9 Pro",                       "score": "3215" },
          { "model": "Qualcomm Snapdragon 8 Elite Reference Device","score": "3228" }
        ]
      },
      {
        "name": "Geekbench 6.6 Multi-Core",
        "value": "9188",
        "unit": "points",
        "category": "cpu",
        "minValue": "7656",
        "maxValue": "10401",
        "percentile": "32",
        "deviceScores": [
          { "model": "Nubia RedMagic Astra",                       "score": "7656" },
          { "model": "OnePlus 13",                                 "score": "9369" },
          { "model": "Asus ROG Phone 9 Pro",                       "score": "10323" },
          { "model": "Qualcomm Snapdragon 8 Elite Reference Device","score": "10401" }
        ]
      },
      {
        "name": "AnTuTu v10 Total Score",
        "value": "2655780",
        "unit": "Points",
        "category": "cpu",
        "minValue": "2090800",
        "maxValue": "3015110",
        "percentile": "77",
        "deviceScores": [
          { "model": "Honor Magic V5",                             "score": "2090799" },
          { "model": "Xiaomi 15 Pro",                              "score": "2611586" },
          { "model": "Asus ROG Phone 9 Pro",                       "score": "2956859" },
          { "model": "Qualcomm Snapdragon 8 Elite Reference Device","score": "3015111" }
        ]
      },
      {
        "name": "3DMark Sling Shot Extreme (ES 3.1) Unlimited Physics",
        "value": "7982",
        "unit": "Points",
        "category": "gpu",
        "minValue": "5466",
        "maxValue": "10259",
        "percentile": "75",
        "deviceScores": [
          { "model": "Xiaomi 15",          "score": "5466" },
          { "model": "OnePlus 13",         "score": "8674" },
          { "model": "Asus ROG Phone 9 Pro","score": "10259" }
        ]
      },
      {
        "name": "Geekbench 5.5 Power Consumption 150cd *",
        "value": "6.317",
        "unit": "Watt",
        "category": "cpu",
        "percentile": "3",
        "smallerIsBetter": true,
        "deviceScores": [
          { "model": "Sony Xperia 1 VII",  "score": "1.019" },
          { "model": "OnePlus 13",         "score": "6.08"  },
          { "model": "Asus ROG Phone 9 Pro","score": "8.15" }
        ]
      }
    ],

    "devicesUsing": [
      {
        "name": "Xiaomi 15",
        "url": "https://www.notebookcheck.net/Xiaomi-15-smartphone-review-..."
      },
      {
        "name": "OnePlus 13",
        "url": "https://www.notebookcheck.net/OnePlus-13-Smartphone-Review-..."
      },
      {
        "name": "Oppo Find X8 Ultra",
        "url": "https://www.notebookcheck.net/The-camera-monster-degrades-..."
      }
    ],

    "images": [
      "https://www.notebookcheck.net/fileadmin/Notebooks/Qualcomm/Snapdragon-8-Elite/snapdragon-8-elite-badge.jpeg"
    ]
  }
}
```

> The full response includes 20+ benchmark entries across `cpu`, `gpu`, `memory`, and `misc` categories — each with `percentile`, `minValue`, `maxValue`, and a full `deviceScores` array listing every NBC-tested device that uses this chip with its individual score. The snippet above is abbreviated; `devicesUsing` in the real response links directly to the NBC review URL for each device.

</details>

| Endpoint | Description |
|----------|-------------|
| `GET /api/processor?q=<chip>` | Full processor data by name |
| `GET /api/processor/suggestions?q=<chip>` | Autocomplete suggestions |
| `GET /api/processor/device?url=<notebookcheck-url>` | Scrape SoC from a specific review page |
| `GET /api/processor/debug?q=<chip>` | Per-stage timing and candidate scoring |
| `GET /api/processor/search?q=<chip>` | Raw search results before scoring |

---

### Search & Suggestions

```bash
# GSMArena-powered device autocomplete (returns name + image URL)
GET /api/phone/suggestions?q=vivo+x300

# NBC suggestions via TYPO3 POST search (2,000+ reviewed devices)
GET /api/nbc/suggestions?q=vivo+x300
```

---

### Scrape by URL

```bash
# Scrape any NBC review URL directly — bypasses search entirely
GET /api/nbc/device?url=https://www.notebookcheck.net/Vivo-X300-Pro-review.1184298.0.html

# Scrape any GSMArena device page directly
GET /api/phone/device?url=https://www.gsmarena.com/vivo_x300_pro-12345.php
```

---

### Debug & Timing

```bash
# Per-stage timing — which layer resolved the request and how long each took
GET /api/phone/debug?q=vivo+x300+pro

# Raw TYPO3 search results, scoring, and timing
GET /api/nbc/direct-debug?q=vivo+x300+pro

# SearXNG fallback debug — raw links, scores, winning candidate
GET /api/nbc/searxng-debug?q=vivo+x300+pro
```

```json
{
  "query": "vivo x300 pro",
  "source": "index",
  "totalMs": 312,
  "timing": { "indexSearchMs": 14, "indexScrapeMs": 298 },
  "cached": false,
  "result": {
    "title": "Vivo X300 Pro",
    "rating": "88%",
    "hasBenchmarks": true,
    "hasSpecs": true,
    "imageCounts": {
      "device": 12,
      "deviceAngles": 4,
      "cameraSamples": 5,
      "screenshots": 16,
      "charts": 6,
      "displayMeasurements": 8,
      "colorCalibration": 5
    }
  }
}
```

---

### Crawl Index

The crawl index pre-fetches device review URLs from three independent NBC listing sources into Redis. Once seeded, `/api/phone` lookups resolve from index in milliseconds — no live scraping on each request.

**Three crawl sources:**

| Source | Endpoint | Coverage |
|--------|----------|---------|
| A — NBC Reviews listing | `GET /api/index/crawl-reviews-page?page=N` | All reviewed smartphones (~80 pages) |
| B — NBC Chronological library | `GET /api/index/crawl-page?page=N` | Broader device library including older phones |
| C — NBC Smartphone listing | `GET /api/index/crawl-smartphone-page?page=N` | Current smartphone catalogue |

| Endpoint | Description |
|----------|-------------|
| `GET /api/index/crawl?maxPages=20` | Crawl N pages across all three sources |
| `GET /api/index/status` | Coverage stats, queue breakdown, error count |
| `GET /api/index/list?status=pending&limit=20` | Browse indexed entries by status |
| `GET /api/index/validate?count=10` | Verify N random index URLs are still valid |
| `GET /api/index/scrape-one?url=<url>` | Scrape and cache one specific indexed device |
| `GET /api/index/search-debug?q=<device>` | Verify index hit/miss for a query |
| `GET /api/index/errors` | List entries that failed scraping |
| `GET /api/index/reset-errors` | Re-queue all errored entries for retry |
| `GET /api/index/brands` | Brand breakdown of the current index |
| `GET /api/index/rebuild-search` | Rebuild the fast in-memory search index from Redis |
| `GET /api/index/resolve-url?url=<url>` | Debug: resolve a library URL to its review URL |
| `GET /api/index/swap-all` | Swap all library URLs that have a cached review URL |
| `GET /api/index/purge-library-duplicates` | Remove library entries superseded by review URLs |
| `GET /api/index/migrate-review-urls` | Resumable batch migration (library → review URLs) |
| `GET /api/index/clear` | ⚠️ Clear the entire crawl index |

```bash
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

> **Recommended setup:** Run `/api/index/crawl?maxPages=20` once after deployment to seed the index. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `/api/nbc/keepalive` every 10 minutes to keep a SearXNG instance warm on Render's free tier.

---

### Browser Dashboards

The API ships three self-contained HTML dashboards for index management — no external tools needed. Each dashboard is a live, reactive UI with real-time progress bars, status indicators, and one-click pipeline controls.

![Dashboard UI Preview](./docs/dashboard-preview.png)
> *`/migrate` dashboard — live batch migration progress with per-URL status, error counts, and auto-resume. Add `docs/dashboard-preview.png` to your repo to render this screenshot.*

| Route | Description |
|-------|-------------|
| `/migrate` | Self-running batch migration: library URLs → review URLs, with live progress bars |
| `/recover` | Re-crawls all chronological pages, resolves library URLs, purges duplicates in sequence |
| `/recrawl` | Full reset pipeline: flush Redis → crawl Source A → crawl Source B → purge dupes → rebuild index |

---

### Error Schema

Every failure state returns a consistent envelope so you can handle errors without parsing error messages.

```json
{
  "success": false,
  "error": "Device not found",
  "code": "NOT_FOUND",
  "query": "vivo x999 ultra",
  "source": null,
  "durationMs": 142
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `false` | Always `false` on error — your primary branch condition |
| `error` | `string` | Human-readable error message |
| `code` | `string` | Machine-readable error code (`NOT_FOUND`, `SCRAPE_FAILED`, `RATE_LIMITED`, `INVALID_QUERY`) |
| `query` | `string \| null` | The original query string, if one was provided |
| `source` | `null` | Always `null` on error |
| `durationMs` | `number` | Total request time in milliseconds, useful for timeout debugging |

> HTTP status codes map predictably: `400` for invalid/missing parameters, `404` for device not found, `429` for upstream proxy quota exhaustion, `500` for scraper or parse failures.

---

## Image Buckets

Every device response includes an `images` object with content sorted into 7 typed buckets. Classification runs in three passes using filename patterns, section context, and caption analysis — not guesswork.

| Bucket | Contents |
|--------|----------|
| `device` | Hero product shots, colour variant photos |
| `deviceAngles` | Hardware detail shots — top, bottom, left, right, ports, buttons, SIM tray |
| `cameraSamples` | Photos **taken by** the phone — main / ultra-wide / tele / zoom / low-light / selfie / Portrait Studio |
| `screenshots` | OS and UI screenshots (Android, settings, apps) |
| `charts` | GNSS tracks, battery discharge plots, camera resolution charts |
| `displayMeasurements` | Oscilloscope PWM waveforms (RigolDS\*.jpg), subpixel microscopy |
| `colorCalibration` | Calman colour accuracy plots, colour space coverage, greyscale charts |

The classifier has 9 named fixes applied for real-world edge cases including `aPic_` naming (Vivo X300 Pro — all shots use this prefix; correctly split across `device` / `deviceAngles` / `cameraSamples` by section context), large asset-ID heatmaps (Xiaomi 17 Ultra), lender/partner logo leakage from `/Notebooks/Leihsteller/`, competitor device silhouettes from NBC's `.nbcCI_zoom` size-comparison widget, and `csm_*` processed thumbnails which are the only version of device shots NBC actually serves.

---

## Benchmark Categories

Every device response includes a `benchmarks` object with results auto-categorised across 10 buckets. All categories are populated in the Vivo X300 Pro sample above with real NBC lab data.

| Category | Examples |
|----------|---------|
| `cpu` | Geekbench 6 Single/Multi, AnTuTu, PCMark Work, Geekbench AI NPU |
| `gpu` | 3DMark Wild Life Extreme, Solar Bay, Steel Nomad Light, GFXBench Aztec |
| `display` | APL18/HDR peak brightness (cd/m²), ΔE ColorChecker, PWM frequency, gamma, CCT |
| `battery` | WiFi runtime (h), reader/idle (h), load runtime (h) |
| `storage` | Sequential/random read-write (MB/s) |
| `networking` | iperf3 transmit/receive at 5 GHz and 6 GHz (MBit/s) |
| `memory` | RAM bandwidth tests |
| `thermal` | Max surface temperature (°C) |
| `audio` | Max volume (dB), frequency response |
| `other` | AI inference scores (UL Procyon, AImark), WebXPRT, anything else |

---

## Cloudflare Bypass Architecture

NotebookCheck uses Cloudflare WAF that blocks datacenter IPs. The cascade tries layers in order, skipping any layer whose key is not set.

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
Layer 5: FlareSolverr / Flask     ← your existing Render service (free)
```

Combined across all four free tiers: ~4,000 bypass requests per month. You only need **one** key for this to work — unused layers are skipped gracefully. Sign up for all four for maximum resilience when quotas run out.

---

## Caching

| Layer | Storage | TTL | Behaviour |
|-------|---------|-----|-----------|
| 1st | In-memory Map (500 entries, LRU eviction) | Permanent | Always checked first, zero latency |
| 2nd | Redis via Upstash | Permanent (no EX) | Checked on memory miss, survives cold starts |

Cache keys are schema-versioned (e.g. `nbc:phone-full:v2:...`) — bumping the version in code instantly invalidates all stale data with no manual flush. A checksum of the `NBCDeviceData` field list is computed at startup so any change to the data shape auto-increments the cache key.

---

## Environment Variables

Optional — the API works without any keys using direct fetch with stealth headers. Add keys to unlock more resilience.

### Cloudflare Bypass

| Variable | Provider | Free Tier |
|----------|----------|-----------|
| `SCRAPERAPI_KEY` | [scraperapi.com](https://scraperapi.com) | 1,000 req/month |
| `SCRAPEDO_TOKEN` | [scrape.do](https://scrape.do) | 1,000 req/month |
| `WEBSCRAPINGAPI_KEY` | [webscrapingapi.com](https://webscrapingapi.com) | 1,000 req/month |
| `ZENROWS_KEY` | [zenrows.com](https://zenrows.com) | 1,000 req/month |
| `FLARESOLVERR_URL` | Self-hosted / Render | Free |

### Cache & Search

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `SEARXNG_URL` | Your SearXNG instance URL (device search fallback) |

Get free Redis at [console.upstash.com](https://console.upstash.com). Get a free SearXNG instance at [searxng-notebookcheck.onrender.com](https://searxng-notebookcheck.onrender.com) or self-host on Render's free tier.

---

## Architecture

```
Client Request
      │
      ▼
  Vercel Edge
      │
      ▼
Express Router ──→ Route Handler
                        │
               ┌────────┴────────┐
               ▼                 ▼
         In-Memory Map      Redis (Upstash)
         (500 entries)      (persistent)
               │                 │
               └────────┬────────┘
                        │ cache miss
                        ▼
                 Crawl Index Search
                 (Redis key-value, 3 sources)
                        │ index miss
                        ▼
              5-Layer CF Bypass Cascade
                        │
                        ▼
              NBC / GSMArena Scraper
                        │
                        ▼
              7-Bucket Image Classifier
              10-Category Benchmarks
              SoC + Camera Lens Parser
                        │
                        ▼
               Structured JSON
                → cached → returned
```

---

## Project Structure

```
├── index.ts                          # Express routes + Vercel handler + browser dashboards
└── src/
    ├── flaresolverr.ts               # 5-layer Cloudflare bypass cascade
    ├── gsmarena.ts                   # GSMArena search + device scraper
    ├── notebookcheck.ts              # Core NBC scraper — specs, benchmarks, 7-bucket image classifier, cameras
    ├── notebookcheck_index.ts        # Crawl index — 3-source Redis-backed URL store + in-memory search
    └── notebookcheck_processor.ts    # Processor / SoC scraper — cores, GPU, NPU, memory
```

---

## Use Cases

- **Mobile comparison platforms** — side-by-side review data, benchmarks, and camera specs in one call
- **AI phone apps** — feed your LLM clean, structured NBC data including real lab measurements (ΔE, PWM, runtime)
- **Tech review sites** — embed live specs, ratings, and benchmark numbers without maintaining a database
- **Research tools** — analyse smartphone trends with actual measured display and battery data per device
- **Benchmark trackers** — pull structured Geekbench / 3DMark / AnTuTu time-series for any reviewed phone

---

## Contributing

Issues and PRs are welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

---

## ⚠️ Disclaimer

This project scrapes publicly accessible pages for personal and educational use. It is not affiliated with NotebookCheck or GSMArena. Use responsibly and respect their terms of service.

---

## License

[MIT](./LICENSE) © 2026 — Made with ❤️ by [Sanjeevu-Tarun](https://github.com/Sanjeevu-Tarun)

<!-- SEO: NotebookCheck API, NotebookCheck scraper, GSMArena API, phone review API, smartphone benchmark API, Cloudflare bypass scraper, image classification API, camera sample scraper, SoC scraper, processor data API, phone specs API, mobile review scraper, TypeScript scraper API, Vercel serverless API, Upstash Redis cache, NBC review scraper, benchmark extraction API, display calibration API, PWM measurement API, Calman plot API -->
