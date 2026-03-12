import * as cheerio from 'cheerio';
import { fetchWithCF } from './flaresolverr';

const BASE = 'https://nanoreview.net';

// Simple in-memory cache — same as GSMArena scraper
const cache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCache(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL) return hit.data;
  return null;
}
function setCache(key: string, data: any) {
  cache.set(key, { data, time: Date.now() });
}

// Search NanoReview for a device
export async function searchDevice(query: string) {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE}/en/search?q=${encodeURIComponent(query)}`;
  const html = await fetchWithCF(url);
  const $ = cheerio.load(html);

  const results: any[] = [];

  // Scrape search result links
  $('a[href*="/en/phone/"], a[href*="/en/soc/"], a[href*="/en/cpu/"], a[href*="/en/gpu/"], a[href*="/en/laptop/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const name = $(el).find('h2, h3, .title, [class*="name"]').first().text().trim() || $(el).text().trim();
    const img = $(el).find('img').attr('src') || '';
    const typeMatch = href.match(/\/en\/(phone|soc|cpu|gpu|laptop|tablet)\//);
    const slugMatch = href.match(/\/en\/(?:phone|soc|cpu|gpu|laptop|tablet)\/([^/?#]+)/);

    if (name && name.length > 1 && typeMatch && slugMatch) {
      results.push({
        name: name.trim(),
        type: typeMatch[1],
        slug: slugMatch[1],
        image: img.startsWith('http') ? img : img ? `${BASE}${img}` : '',
        url: `${BASE}${href}`,
      });
    }
  });

  // Deduplicate
  const seen = new Set();
  const unique = results.filter(r => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });

  setCache(cacheKey, unique);
  return unique;
}

// Scrape full device details page
export async function getDeviceDetails(type: string, slug: string) {
  const cacheKey = `device:${type}:${slug}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const url = `${BASE}/en/${type}/${slug}`;
  const html = await fetchWithCF(url);
  const $ = cheerio.load(html);

  const data: any = {
    title: $('h1').first().text().trim(),
    sourceUrl: url,
    type,
    slug,
    scores: {},
    pros: [],
    cons: [],
    specs: {},
    images: [],
  };

  // Images
  $('img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src') || '';
    if (!src) return;
    const full = src.startsWith('http') ? src : `${BASE}${src}`;
    const l = full.toLowerCase();
    if (!l.includes('logo') && !l.includes('icon') && !l.includes('svg') && full.startsWith('http')) {
      data.images.push(full);
    }
  });
  data.images = [...new Set(data.images)];

  // Scores
  $('[class*="score"], [class*="rating"], .progress-bar').each((_, el) => {
    const label = $(el).find('[class*="title"], [class*="name"], [class*="label"]').first().text().trim();
    const value = $(el).find('[class*="value"], [class*="num"], [class*="score"]').first().text().trim();
    if (label && value && label !== value) data.scores[label] = value;
  });

  // Pros
  $('[class*="pros"] li, [class*="plus"] li, .green li').each((_, el) => {
    const t = $(el).text().trim();
    if (t) data.pros.push(t);
  });

  // Cons
  $('[class*="cons"] li, [class*="minus"] li, .red li').each((_, el) => {
    const t = $(el).text().trim();
    if (t) data.cons.push(t);
  });

  // Specs tables
  $('.card, .box, section, [class*="specs"], [class*="param"]').each((_, card) => {
    const sectionTitle = $(card).find('h2, h3, .card-title, .card-header').first().text().trim() || 'Details';
    const section: Record<string, string> = {};
    $(card).find('table tr').each((__, row) => {
      const cells = $(row).find('td, th');
      if (cells.length >= 2) {
        const k = cells.first().text().trim().replace(/:$/, '');
        const v = cells.last().text().trim();
        if (k && v && k !== v) section[k] = v;
      }
    });
    if (Object.keys(section).length > 0) data.specs[sectionTitle] = section;
  });

  setCache(cacheKey, data);
  return data;
}

// Search + scrape in one call — main endpoint
export async function searchAndGetDetails(query: string, index = 0) {
  const results = await searchDevice(query);
  if (!results.length) return null;

  // Score match quality
  const q = query.toLowerCase();
  results.sort((a: any, b: any) => {
    const sa = a.name.toLowerCase(), sb = b.name.toLowerCase();
    const score = (n: string) => n === q ? 1000 : n.includes(q) ? 500 : q.split(' ').filter((w: string) => n.includes(w)).length * 10;
    return score(sb) - score(sa);
  });

  const item = results[Math.min(index, results.length - 1)];
  const details = await getDeviceDetails(item.type, item.slug);
  return { ...details, searchResults: results };
}