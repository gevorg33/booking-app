import { findResourceConflicts, intervalsOverlap } from './resource-scheduling.util.js';

describe('resource-scheduling.util', () => {
  const t0 = new Date('2026-06-01T10:00:00Z');
  const t1 = new Date('2026-06-01T11:00:00Z');
  const t2 = new Date('2026-06-01T11:30:00Z');
  const t3 = new Date('2026-06-01T12:00:00Z');

  it('detects overlapping intervals', () => {
    expect(intervalsOverlap(t0, t1, new Date('2026-06-01T10:30:00Z'), t2)).toBe(true);
    expect(intervalsOverlap(t0, t1, t1, t3)).toBe(false);
  });

  it('returns conflicting resource ids', () => {
    const conflicts = findResourceConflicts(
      [
        {
          resourceIds: ['room-a'],
          startTime: t0,
          endTime: t1,
          bookingId: 'b1',
        },
      ],
      {
        resourceIds: ['room-a', 'room-b'],
        startTime: new Date('2026-06-01T10:30:00Z'),
        endTime: t2,
      },
    );
    expect(conflicts).toEqual(['room-a']);
  });

  it('ignores same booking when excluding', () => {
    const conflicts = findResourceConflicts(
      [
        {
          resourceIds: ['room-a'],
          startTime: t0,
          endTime: t1,
          bookingId: 'b1',
        },
      ],
      {
        resourceIds: ['room-a'],
        startTime: t0,
        endTime: t1,
        bookingId: 'b1',
      },
    );
    expect(conflicts).toEqual([]);
  });

  it('returns empty when windows do not overlap', () => {
    const conflicts = findResourceConflicts(
      [
        {
          resourceIds: ['room-a'],
          startTime: t0,
          endTime: t1,
        },
      ],
      {
        resourceIds: ['room-a'],
        startTime: t2,
        endTime: t3,
      },
    );
    expect(conflicts).toEqual([]);
  });

  it('returns empty conflicts for empty candidate resources', () => {
    const conflicts = findResourceConflicts(
      [{ resourceIds: ['room-a'], startTime: t0, endTime: t1 }],
      { resourceIds: [], startTime: t0, endTime: t1 },
    );
    expect(conflicts).toEqual([]);
  });
});
