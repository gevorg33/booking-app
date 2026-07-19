import type { PublicOpeningHours } from './types.js';

/** e2e-bug.50 — prefer API summaryLines for profile display. */
export function openingHoursSummaryLines(
  openingHours?: PublicOpeningHours | null,
): string[] {
  if (!openingHours?.summaryLines?.length) return [];
  return openingHours.summaryLines.filter((line) => line.trim().length > 0);
}
