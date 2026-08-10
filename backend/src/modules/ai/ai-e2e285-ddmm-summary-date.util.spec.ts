import {
  E2E285_AI_DATE_LABEL_CASES,
  E2E285_SKIP_ENRICH_ACTIONS,
  E2E285_SUMMARY_MISREAD_CASES,
} from './ai-e2e285-ddmm-summary-date.fixtures.js';
import {
  formatDateForAiLabel,
  isAiDateGroundedBookingAction,
  summaryMisreadsStartTimeMonth,
} from './ai-date-label.util.js';
import { formatBookingCreatedLine } from './ai-result-format.util.js';
import { CommandReasoningService } from './command-reasoning.service.js';

describe('e2e-bug.285 DD/MM AI summary date labels', () => {
  it.each(E2E285_AI_DATE_LABEL_CASES.map((row) => [row.id, row] as const))(
    'formatDateForAiLabel is unambiguous for $id',
    (_id, row) => {
      const label = formatDateForAiLabel(row.isoDayOrStart);
      expect(label).toContain(row.expectContains);
      expect(label).not.toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      if (row.forbidSlashDdMm) {
        expect(label).not.toContain(row.forbidSlashDdMm);
      }
    },
  );

  it.each(E2E285_SUMMARY_MISREAD_CASES.map((row) => [row.id, row] as const))(
    'summaryMisreadsStartTimeMonth detects $id',
    (_id, row) => {
      expect(summaryMisreadsStartTimeMonth(row.summary, row.startTime)).toBe(
        row.expectMisread,
      );
    },
  );

  it('formatBookingCreatedLine uses August not 01/08 slash for Aug 1', () => {
    const line = formatBookingCreatedLine({
      employeeName: 'Gevorg',
      serviceName: 'Swedish massage',
      startTime: '2026-08-01T09:00:00.000Z',
      endTime: '2026-08-01T10:00:00.000Z',
      bookingId: 'b1',
    });
    expect(line).toContain('August');
    expect(line).not.toContain('01/08/2026');
    expect(line).not.toContain('January');
  });

  it.each(E2E285_SKIP_ENRICH_ACTIONS.map((a) => [a] as const))(
    'isAiDateGroundedBookingAction(%s)',
    (action) => {
      expect(isAiDateGroundedBookingAction(action)).toBe(true);
    },
  );

  it('CommandReasoningService skips enrich for create_booking / reschedule_booking', async () => {
    const openAi = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        summary: 'Booked for tomorrow, January 8, 2026',
        reasoning: 'rewrote',
      })),
    };
    const service = new CommandReasoningService(openAi as any);
    const grounded =
      '• Booking created: Swedish massage with Gevorg — 1 August 2026 09:00–10:00';

    for (const action of ['create_booking', 'reschedule_booking'] as const) {
      openAi.completeJson.mockClear();
      const result = await service.enrichResult('biz-1', 'book nearest', {
        success: true,
        action,
        summary: grounded,
        details: {},
      });
      expect(result.summary).toBe(grounded);
      expect(result.summary).not.toMatch(/January/i);
      expect(openAi.completeJson).not.toHaveBeenCalled();
    }
  });
});
