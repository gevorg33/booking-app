/** prov-exp-7.3 — provider calendar open shift gaps. */

export interface ProviderScheduleGapView {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function buildFillGapAiPrompt(
  dateKey: string,
  gap: Pick<ProviderScheduleGapView, 'startTime' | 'endTime'>,
): string {
  return `Fill this gap on ${dateKey} from ${gap.startTime} to ${gap.endTime} — suggest waitlist customers who could book it.`;
}

export function formatGapDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}
