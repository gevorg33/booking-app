/**
 * e2e-bug.49 — allowlist Google Maps iframe embeds.
 * Rejects inline event handlers and other attributes that can XSS via
 * dangerouslySetInnerHTML (blocklist `<script|javascript:` was insufficient).
 */

const ALLOWED_ATTRS = new Set([
  'src',
  'width',
  'height',
  'style',
  'loading',
  'referrerpolicy',
  'allowfullscreen',
  'allow',
  'title',
  'frameborder',
]);

/** https Google Maps / Maps Embed / Maps API origins only. */
const SAFE_MAPS_SRC =
  /^https:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps(?:\/|$)|maps\.google\.[a-z.]+(?:\/|$)|maps\.googleapis\.com(?:\/|$))/i;

const ONE_ATTR_RE =
  /^([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?(?:\s+|$)/;

const SAFE_STYLE_RE = /^[a-zA-Z0-9\s:#%;,.()%-]+$/;

type ParsedAttr = { name: string; value: string | true };

function parseAttributes(attrString: string): ParsedAttr[] | null {
  let remaining = attrString.trim();
  if (!remaining) return [];

  const attrs: ParsedAttr[] = [];
  const seen = new Set<string>();

  while (remaining.length > 0) {
    const match = remaining.match(ONE_ATTR_RE);
    if (!match) return null;
    const name = match[1].toLowerCase();
    if (seen.has(name)) return null;
    seen.add(name);

    if (match[2] !== undefined) attrs.push({ name, value: match[2] });
    else if (match[3] !== undefined) attrs.push({ name, value: match[3] });
    else if (match[4] !== undefined) attrs.push({ name, value: match[4] });
    else attrs.push({ name, value: true });

    remaining = remaining.slice(match[0].length).trimStart();
  }

  return attrs;
}

function isSafeStyle(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return false;
  if (/url\s*\(|expression\s*\(|javascript:|@import/i.test(trimmed)) {
    return false;
  }
  return SAFE_STYLE_RE.test(trimmed);
}

function isSafeMapsSrc(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    return SAFE_MAPS_SRC.test(url.href);
  } catch {
    return false;
  }
}

/**
 * Returns a sanitized single-iframe embed string, or null if the input is invalid.
 * Only `src` (+ a small allowlist of presentational attrs) survive.
 */
export function sanitizeGoogleMapEmbed(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed || trimmed.length > 4000) return null;

  const match = trimmed.match(/^<iframe\b([^>]*)>([\s\S]*)<\/iframe>$/i);
  if (!match) return null;
  if (match[2].trim().length > 0) return null; // no nested markup/content

  const parsed = parseAttributes(match[1] ?? '');
  if (!parsed) return null;

  const kept: Array<[string, string | true]> = [];
  let src: string | undefined;

  for (const { name, value } of parsed) {
    if (name.startsWith('on')) return null;
    if (!ALLOWED_ATTRS.has(name)) return null;

    if (name === 'src') {
      if (typeof value !== 'string' || !isSafeMapsSrc(value)) return null;
      src = value.trim();
      kept.push([name, src]);
      continue;
    }

    if (name === 'style') {
      if (typeof value !== 'string' || !isSafeStyle(value)) return null;
      kept.push([name, value.trim()]);
      continue;
    }

    if (name === 'allowfullscreen') {
      kept.push([name, true]);
      continue;
    }

    if (typeof value !== 'string') return null;
    const clean = value.trim();
    if (!clean || /[<>`]/.test(clean)) return null;
    if (name === 'loading' && !/^(lazy|eager|auto)$/i.test(clean)) return null;
    if (name === 'referrerpolicy' && !/^[a-z-]+$/i.test(clean)) return null;
    if (
      (name === 'width' || name === 'height' || name === 'frameborder') &&
      !/^\d+%?$/.test(clean)
    ) {
      return null;
    }
    if (name === 'allow' && !/^[a-z0-9; -]+$/i.test(clean)) return null;
    if (name === 'title' && clean.length > 120) return null;
    kept.push([name, clean]);
  }

  if (!src) return null;

  const attrHtml = kept
    .map(([name, value]) =>
      value === true ? ` ${name}` : ` ${name}="${value.replace(/"/g, '&quot;')}"`,
    )
    .join('');

  return `<iframe${attrHtml}></iframe>`;
}

export function isValidGoogleMapEmbed(html: string): boolean {
  return sanitizeGoogleMapEmbed(html) !== null;
}
