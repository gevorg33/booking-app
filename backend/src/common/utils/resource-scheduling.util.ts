export interface ResourceBookingWindow {
  resourceIds: string[];
  startTime: Date;
  endTime: Date;
  bookingId?: string;
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Returns resource IDs that conflict with the candidate window. */
export function findResourceConflicts(
  existing: ResourceBookingWindow[],
  candidate: ResourceBookingWindow,
): string[] {
  const conflicts = new Set<string>();
  const candidateSet = new Set(candidate.resourceIds);

  for (const booking of existing) {
    if (
      candidate.bookingId &&
      booking.bookingId &&
      candidate.bookingId === booking.bookingId
    ) {
      continue;
    }
    if (
      !intervalsOverlap(
        booking.startTime,
        booking.endTime,
        candidate.startTime,
        candidate.endTime,
      )
    ) {
      continue;
    }
    for (const resourceId of booking.resourceIds) {
      if (candidateSet.has(resourceId)) {
        conflicts.add(resourceId);
      }
    }
  }

  return [...conflicts];
}
