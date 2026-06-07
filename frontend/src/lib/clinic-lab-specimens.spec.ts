import { describe, expect, it } from 'vitest';
import {
  buildSpecimenQueueQueryParams,
  getSpecimenTransitionActions,
  specimenOpsBasePath,
} from './clinic-lab-specimens';

describe('clinic-lab-specimens', () => {
  it('builds query params for collection view', () => {
    expect(
      buildSpecimenQueueQueryParams({
        view: 'collection',
        status: 'NotCollected',
        from: '2026-06-01',
      }),
    ).toEqual({
      view: 'collection',
      status: 'NotCollected',
      from: '2026-06-01T00:00:00.000Z',
    });
  });

  it('returns collection actions for not collected specimens', () => {
    expect(getSpecimenTransitionActions('collection', 'NotCollected')).toEqual([
      { toStatus: 'Collected', labelKey: 'markCollected' },
      { toStatus: 'Rejected', labelKey: 'reject' },
    ]);
  });

  it('returns v1 tracking shortcut for collected specimens', () => {
    expect(getSpecimenTransitionActions('tracking', 'Collected')).toContainEqual({
      toStatus: 'ReceivedInLab',
      labelKey: 'markReceivedInLab',
      v1ShortPath: true,
    });
  });

  it('includes department and to-date filters', () => {
    expect(
      buildSpecimenQueueQueryParams({
        view: 'tracking',
        department: 'Laboratory',
        to: '2026-06-07',
      }),
    ).toEqual({
      view: 'tracking',
      department: 'Laboratory',
      to: '2026-06-07T23:59:59.999Z',
    });
  });

  it('returns no actions for statuses outside the active view', () => {
    expect(getSpecimenTransitionActions('collection', 'InTransit')).toEqual([]);
  });

  it('builds specimen ops routes', () => {
    expect(specimenOpsBasePath('tracking')).toBe('/dashboard/lab-specimens/tracking');
  });
});