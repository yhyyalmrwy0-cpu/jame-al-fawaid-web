import { Benefit } from '../types';
import { normalizeArabicText, formatToHijriAndGregorian } from '../utils';

export interface LightSearchOptions {
  query: string;
  isFullText: boolean; // false = Fast default search (title, category, source, date), true = Full text search inside body
}

interface NormalizedCache {
  titleNorm: string;
  metaNorm: string;
  contentNorm: string;
}

// In-memory normalized cache to ensure sub-millisecond execution without re-normalizing text on every key stroke
const benefitNormCache = new Map<string, NormalizedCache>();

/**
 * Normalizes and caches a benefit's search fields in RAM.
 */
function getOrNormalizedBenefit(b: Benefit): NormalizedCache {
  let cached = benefitNormCache.get(b.id);
  if (!cached) {
    const titleNorm = normalizeArabicText(b.title || '');
    const metaNorm = normalizeArabicText([
      b.category || '',
      b.source || '',
      b.date || '',
      formatToHijriAndGregorian(b.date || '')
    ].join(' '));
    const contentNorm = normalizeArabicText(b.content || '');

    cached = { titleNorm, metaNorm, contentNorm };
    benefitNormCache.set(b.id, cached);
  }
  return cached;
}

/**
 * Clears or updates the in-memory cache when benefits change.
 */
export function syncBenefitsFTS(benefits: Benefit[]): void {
  const activeIds = new Set(benefits.map(b => b.id));

  // Remove deleted items from memory cache
  for (const id of benefitNormCache.keys()) {
    if (!activeIds.has(id)) {
      benefitNormCache.delete(id);
    }
  }

  // Pre-warm cache for new items
  for (const b of benefits) {
    getOrNormalizedBenefit(b);
  }
}

/**
 * Lightweight, high-performance in-memory search function with:
 * 1. AbortSignal support to cancel obsolete search cycles.
 * 2. 3-character minimum requirement.
 * 3. Default Fast Mode (Title + Category/Tags + Source + Date).
 * 4. Full-Text Mode toggle (includes full body text).
 */
export function searchBenefitsFTS(
  benefits: Benefit[],
  options: LightSearchOptions,
  signal?: AbortSignal
): Benefit[] {
  const rawQuery = options.query ? options.query.trim() : '';

  // Requirement: Minimum 3 characters
  if (rawQuery.length < 3) {
    return benefits;
  }

  const normalizedQuery = normalizeArabicText(rawQuery);
  if (!normalizedQuery) return benefits;

  const queryKeywords = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryKeywords.length === 0) return benefits;

  const results: { benefit: Benefit; score: number }[] = [];

  for (let i = 0; i < benefits.length; i++) {
    // Check if user typed a new character and aborted previous search cycle
    if (signal && signal.aborted) {
      return [];
    }

    const b = benefits[i];
    const cached = getOrNormalizedBenefit(b);

    let titleMatches = 0;
    let metaMatches = 0;
    let contentMatches = 0;
    let matchesAllKeywords = true;

    for (const kw of queryKeywords) {
      let kwFound = false;

      // Priority 1: Title match (weight = 100)
      if (cached.titleNorm.includes(kw)) {
        titleMatches++;
        kwFound = true;
      }

      // Priority 1: Meta/Category/Tags/Source match (weight = 50)
      if (cached.metaNorm.includes(kw)) {
        metaMatches++;
        kwFound = true;
      }

      // Priority 2: Full-Text Content match (ONLY when isFullText is enabled)
      if (options.isFullText) {
        if (cached.contentNorm.includes(kw)) {
          contentMatches++;
          kwFound = true;
        }
      }

      if (!kwFound) {
        matchesAllKeywords = false;
        break; // Keyword missing in this benefit
      }
    }

    if (matchesAllKeywords) {
      const score = (titleMatches * 100) + (metaMatches * 50) + (contentMatches * 10);
      results.push({ benefit: b, score });
    }
  }

  // Sort matched benefits by relevance score descending
  results.sort((a, b) => b.score - a.score);

  return results.map(r => r.benefit);
}
