/** Extract a calendar year from PURSUE incident_date strings (often inconsistent). */

export function parseIncidentYear(raw: string): number | null {
  const s = raw.trim();
  if (!s || s.toUpperCase() === 'N/A') return null;

  const late = s.match(/late\s+(\d{4})/i);
  if (late) {
    const y = parseInt(late[1], 10);
    return Number.isFinite(y) ? y : null;
  }

  const circa = s.match(/(?:circa|c\.)\s*(\d{4})/i);
  if (circa) {
    const y = parseInt(circa[1], 10);
    return Number.isFinite(y) ? y : null;
  }

  const fourDigitWord = s.match(/\b((?:19|20)\d{2})\b/);
  if (fourDigitWord) {
    const y = parseInt(fourDigitWord[1], 10);
    return Number.isFinite(y) ? y : null;
  }

  const md = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (md) {
    let y = parseInt(md[3], 10);
    if (y < 100) y += y >= 70 ? 1900 : 2000;
    return Number.isFinite(y) && y >= 1800 && y <= 2100 ? y : null;
  }

  const iso = s.match(/^(\d{4})-\d{2}-\d{2}/);
  if (iso) {
    const y = parseInt(iso[1], 10);
    return Number.isFinite(y) ? y : null;
  }

  return null;
}

export function yearBucket(year: number | null): string {
  return year === null ? 'Unknown' : String(year);
}

export function locationSlug(raw: string): { display: string; slug: string } {
  const t = raw.trim();
  if (!t || t.toUpperCase() === 'N/A') {
    return { display: 'Unknown', slug: 'unknown' };
  }
  const slug = t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  const safe = slug || 'unknown';
  const display = t.length > 64 ? `${t.slice(0, 61)}…` : t;
  return { display, slug: safe };
}
