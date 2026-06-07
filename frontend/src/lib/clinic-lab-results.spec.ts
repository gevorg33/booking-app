import { describe, expect, it } from 'vitest';
import {
  formatClinicLabChangeHistoryActionLabel,
  formatClinicLabChangeHistoryPropertyLabel,
  formatClinicLabChangeHistoryStatusValue,
  getBookingResultTransitionActions,
  mergeBookingLabResultRows,
  resolveClinicLabChangeHistoryEditedByLabel,
  unwrapClinicLabList,
} from './clinic-lab-results';

const t = (key: string) =>
  ({
    'clinic.labState.result.Pending': 'Pending',
    'clinic.labState.result.Released': 'Released',
    'clinic.labResults.changeHistory.actions.ResultReleased': 'Result released',
    'clinic.labResults.changeHistory.properties.status': 'Status',
    'clinic.labResults.changeHistory.systemActor': 'System',
  })[key] ?? key;

describe('clinic-lab-results', () => {
  it('unwraps nested list payloads', () => {
    expect(unwrapClinicLabList([{ id: '1' }])).toEqual([{ id: '1' }]);
    expect(unwrapClinicLabList({ data: [{ id: '2' }] })).toEqual([{ id: '2' }]);
    expect(unwrapClinicLabList({ data: { data: [{ id: '3' }] } })).toEqual([{ id: '3' }]);
  });

  it('returns booking-detail transition actions by result status', () => {
    expect(getBookingResultTransitionActions('NotReceived')).toEqual([
      { toStatus: 'Pending', labelKey: 'markPending' },
    ]);
    expect(getBookingResultTransitionActions('Completed')).toEqual([
      { toStatus: 'Reviewed', labelKey: 'markReviewed' },
    ]);
    expect(getBookingResultTransitionActions('Reviewed')).toEqual([
      { toStatus: 'Released', labelKey: 'markReleased' },
    ]);
    expect(getBookingResultTransitionActions('Released')).toEqual([]);
  });

  it('merges summaries with result records by order id', () => {
    expect(
      mergeBookingLabResultRows(
        [
          {
            id: 'order-1',
            testName: 'CBC',
            orderStatus: 'AwaitingResults',
            specimenStatus: 'Collected',
          },
        ],
        [
          {
            id: 'result-1',
            orderId: 'order-1',
            status: 'Pending',
            testName: 'CBC',
            measurementFlag: 'Normal',
            completedAt: null,
            reviewedAt: null,
            releasedAt: null,
          },
        ],
      ),
    ).toEqual([
      {
        id: 'order-1',
        orderId: 'order-1',
        resultId: 'result-1',
        testName: 'CBC',
        orderStatus: 'AwaitingResults',
        specimenStatus: 'Collected',
        resultStatus: 'Pending',
        measurementFlag: 'Normal',
        completedAt: null,
        reviewedAt: null,
        releasedAt: null,
      },
    ]);
  });

  it('formats change history labels', () => {
    expect(formatClinicLabChangeHistoryActionLabel('ResultReleased', t)).toBe(
      'Result released',
    );
    expect(formatClinicLabChangeHistoryPropertyLabel('status', t)).toBe('Status');
    expect(formatClinicLabChangeHistoryStatusValue('Pending', t)).toBe('Pending');
    expect(formatClinicLabChangeHistoryStatusValue(null, t)).toBe('—');
    expect(
      resolveClinicLabChangeHistoryEditedByLabel(
        { employeeId: 'emp-1', fullName: 'Alex Lab', role: null },
        t,
      ),
    ).toBe('Alex Lab');
    expect(
      resolveClinicLabChangeHistoryEditedByLabel(
        { employeeId: 'emp-1', fullName: null, role: null },
        t,
      ),
    ).toBe('emp-1');
  });

  it('formats order and specimen status values in history rows', () => {
    const localized = (key: string) =>
      ({
        'clinic.labState.order.AwaitingResults': 'Awaiting results',
        'clinic.labState.specimen.Collected': 'Collected',
      })[key] ?? key;

    expect(formatClinicLabChangeHistoryStatusValue('AwaitingResults', localized)).toBe(
      'Awaiting results',
    );
    expect(formatClinicLabChangeHistoryStatusValue('Collected', localized)).toBe(
      'Collected',
    );
    expect(formatClinicLabChangeHistoryStatusValue('UnknownStatus', localized)).toBe(
      'UnknownStatus',
    );
  });
});
