export interface ScheduleCreationSnapshot {
  slotsCreated: number;
  periodIds: string[];
  slotIds: string[];
}

export interface ScheduleUndoSnapshotInput {
  periodIds?: string[];
  slotIds?: string[];
}

export interface ScheduleUndoDeleteDeps {
  deletePeriods: (businessId: string, periodIds: string[]) => Promise<number | null | undefined>;
  deleteSlots: (businessId: string, slotIds: string[]) => Promise<number | null | undefined>;
}

export function buildScheduleCreationSnapshot(
  savedPeriods: Array<{ id: string }>,
  savedSlots: Array<{ id: string }>,
  slotsCreated: number,
): ScheduleCreationSnapshot {
  return {
    slotsCreated,
    periodIds: savedPeriods.map((p) => p.id),
    slotIds: savedSlots.map((s) => s.id),
  };
}

export function uniqueNonEmptyIds(ids: string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter(Boolean))];
}

/** Deletes period/slot rows recorded when a direct schedule was created (workflow undo). */
export async function deleteScheduleUndoSnapshot(
  businessId: string,
  snapshot: ScheduleUndoSnapshotInput,
  deps: ScheduleUndoDeleteDeps,
): Promise<{ periodsRemoved: number; slotsRemoved: number }> {
  const periodIds = uniqueNonEmptyIds(snapshot.periodIds);
  const slotIds = uniqueNonEmptyIds(snapshot.slotIds);

  let periodsRemoved = 0;
  let slotsRemoved = 0;

  if (periodIds.length > 0) {
    periodsRemoved = (await deps.deletePeriods(businessId, periodIds)) ?? 0;
  }
  if (slotIds.length > 0) {
    slotsRemoved = (await deps.deleteSlots(businessId, slotIds)) ?? 0;
  }

  return { periodsRemoved, slotsRemoved };
}
