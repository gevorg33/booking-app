import {
  buildClinicLabStatusChangeRows,
  mapClinicLabStatusHistoryRow,
  resolveClinicLabChangeHistoryAction,
  sortClinicLabChangeHistoryItems,
} from './clinic-lab-change-history.util.js';

describe('clinic-lab-change-history.util', () => {
  it.each([
    ['result', 'Released', 'Reviewed', 'ResultReleased'],
    ['result', 'Reviewed', 'Completed', 'ResultReviewed'],
    ['result', 'Completed', 'Pending', 'StatusChanged'],
    ['order', 'Cancelled', 'Collecting', 'OrderCancelled'],
    ['order', 'Collecting', 'NotCollected', 'StatusChanged'],
    ['order', 'NotCollected', null, 'Created'],
  ] as const)(
    'resolves %s action for %s from %s',
    (entityType, status, previousStatus, expected) => {
      expect(
        resolveClinicLabChangeHistoryAction(entityType, status, previousStatus),
      ).toBe(expected);
    },
  );

  it('maps status history rows with change items', () => {
    const item = mapClinicLabStatusHistoryRow('result', 'result-1', {
      id: 'hist-1',
      status: 'Released',
      previousStatus: 'Reviewed',
      note: 'Ready for patient',
      createdAt: new Date('2026-06-07T12:00:00.000Z'),
      employeeId: 'emp-1',
      employee: { id: 'emp-1', name: 'Dr Smith' },
    });

    expect(item).toEqual(
      expect.objectContaining({
        id: 'hist-1',
        entityType: 'result',
        entityId: 'result-1',
        action: 'ResultReleased',
        note: 'Ready for patient',
        changes: [{ propertyName: 'status', from: 'Reviewed', to: 'Released' }],
        editedBy: {
          employeeId: 'emp-1',
          fullName: 'Dr Smith',
          role: null,
        },
      }),
    );
  });

  it('builds status change rows', () => {
    expect(buildClinicLabStatusChangeRows('Completed', 'Pending')).toEqual([
      { propertyName: 'status', from: 'Pending', to: 'Completed' },
    ]);
  });

  it('sorts history items newest first', () => {
    const sorted = sortClinicLabChangeHistoryItems([
      {
        id: '1',
        entityType: 'order',
        entityId: 'order-1',
        action: 'StatusChanged',
        date: '2026-06-01T10:00:00.000Z',
        changes: [],
        editedBy: { employeeId: null, fullName: null, role: null },
        note: null,
      },
      {
        id: '2',
        entityType: 'result',
        entityId: 'result-1',
        action: 'ResultReleased',
        date: '2026-06-07T12:00:00.000Z',
        changes: [],
        editedBy: { employeeId: null, fullName: null, role: null },
        note: null,
      },
    ]);

    expect(sorted.map((item) => item.id)).toEqual(['2', '1']);
  });
});
