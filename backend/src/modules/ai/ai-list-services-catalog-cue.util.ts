/**
 * e2e-bug.193 / e2e-bug.226 — plain catalog browse phrasing (full menu).
 * Leaf module (no AI util imports) to avoid payments ↔ retail-finance cycles.
 */
export function isPlainServiceCatalogListPrompt(prompt: string): boolean {
  const p = prompt.trim();
  if (!p) return false;
  if (
    /\bwhat\s+(?:kinds?\s+of\s+)?services?\s+(?:do\s+(?:you|we|i)\s+(?:offer|have|provide)|are\s+(?:available|offered)|can\s+(?:you|i)\s+(?:offer|get|book))\b/i.test(
      p,
    )
  ) {
    return true;
  }
  if (
    /\b(?:list|show)\s+(?:me\s+)?(?:all\s+|your\s+|our\s+)?services?\b/i.test(p)
  ) {
    return true;
  }
  if (/\bservices?\s+do\s+(?:you|we|i)\s+(?:offer|have|provide)\b/i.test(p)) {
    return true;
  }
  // "services are available?" without block/slot/day/time booking cues
  if (
    /\bservices?\s+are\s+available\b/i.test(p) &&
    !/\b(?:block|slot|together|same\s+visit|multi[\s-]?service|cart|combo|tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|at\s+\d|\d{1,2}:\d{2})\b/i.test(
      p,
    )
  ) {
    return true;
  }
  return false;
}
