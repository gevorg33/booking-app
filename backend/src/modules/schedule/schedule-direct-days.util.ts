/** ISO date keys (YYYY-MM-DD) between start/end inclusive, filtered by weekday. */
export function getRepetitiveDirectScheduleDates(
  startDate: string,
  endDate: string,
  applyDays: number[],
): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const allowedDays = new Set(applyDays);
  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    if (allowedDays.has(current.getUTCDay())) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function isRepetitiveDirectScheduleDto(dto: {
  date?: string;
  startDate?: string;
  endDate?: string;
  applyDays?: number[];
}): boolean {
  return Boolean(dto.startDate && dto.endDate && dto.applyDays?.length);
}
