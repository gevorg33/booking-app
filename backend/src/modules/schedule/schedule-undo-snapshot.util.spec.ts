import {
  buildScheduleCreationSnapshot,
  deleteScheduleUndoSnapshot,
  uniqueNonEmptyIds,
} from './schedule-undo-snapshot.util.js';

describe('schedule-undo-snapshot.util', () => {
  it('buildScheduleCreationSnapshot collects ids', () => {
    expect(
      buildScheduleCreationSnapshot(
        [{ id: 'p1' }, { id: 'p2' }],
        [{ id: 's1' }],
        6,
      ),
    ).toEqual({
      slotsCreated: 6,
      periodIds: ['p1', 'p2'],
      slotIds: ['s1'],
    });
  });

  it('uniqueNonEmptyIds dedupes and drops blanks', () => {
    expect(uniqueNonEmptyIds(['a', 'a', '', 'b', ''])).toEqual(['a', 'b']);
    expect(uniqueNonEmptyIds(undefined)).toEqual([]);
  });

  it('deleteScheduleUndoSnapshot removes periods and slots', async () => {
    const deletePeriods = jest.fn(async () => 2);
    const deleteSlots = jest.fn(async () => 5);

    const result = await deleteScheduleUndoSnapshot(
      'biz-1',
      { periodIds: ['p1', 'p1'], slotIds: ['s1'] },
      { deletePeriods, deleteSlots },
    );

    expect(result).toEqual({ periodsRemoved: 2, slotsRemoved: 5 });
    expect(deletePeriods).toHaveBeenCalledWith('biz-1', ['p1']);
    expect(deleteSlots).toHaveBeenCalledWith('biz-1', ['s1']);
  });

  it('deleteScheduleUndoSnapshot skips empty id lists', async () => {
    const deletePeriods = jest.fn();
    const deleteSlots = jest.fn();

    const result = await deleteScheduleUndoSnapshot(
      'biz-1',
      {},
      { deletePeriods, deleteSlots },
    );

    expect(result).toEqual({ periodsRemoved: 0, slotsRemoved: 0 });
    expect(deletePeriods).not.toHaveBeenCalled();
    expect(deleteSlots).not.toHaveBeenCalled();
  });

  it('deleteScheduleUndoSnapshot treats null affected as zero', async () => {
    const result = await deleteScheduleUndoSnapshot(
      'biz-1',
      { periodIds: ['p1'], slotIds: ['s1'] },
      {
        deletePeriods: async () => null,
        deleteSlots: async () => undefined,
      },
    );
    expect(result).toEqual({ periodsRemoved: 0, slotsRemoved: 0 });
  });
});
