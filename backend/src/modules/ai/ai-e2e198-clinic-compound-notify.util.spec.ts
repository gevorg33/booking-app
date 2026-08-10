import {
  E2E198_COMPOUND_NOTIFY_CASES,
  E2E198_NEGATIVE_CASES,
  E2E198_STANDALONE_NOTIFY_CASES,
} from './ai-e2e198-clinic-compound-notify.fixtures.js';
import {
  decomposeCustomerClinicCompoundPrompt,
  isClinicCompoundPrompt,
} from './ai-clinic-compound.util.js';
import {
  isNotifyWhenResultsReadyPrompt,
  parseNotifyWhenResultsReadyFromPrompt,
} from './ai-notify-when-results-ready.util.js';
import { handleNotifyWhenResultsReadyLogic } from './ai-notify-when-results-ready.logic.js';
import type { Business } from '../business/entities/business.entity.js';

const clinicBusiness = {
  id: 'biz-clinic',
  timezone: 'UTC',
  settings: { businessType: 'clinic' },
} as Business;

describe('e2e-bug.198 customer_clinic_compound notify step', () => {
  it.each(E2E198_COMPOUND_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'full prompt $id hits BOOK_COMPOUND_BLOCK alone',
    (_id, row) => {
      expect(isNotifyWhenResultsReadyPrompt(row.fullPrompt)).toBe(false);
      expect(isClinicCompoundPrompt(row.fullPrompt, 'customer')).toBe(true);
    },
  );

  it.each(E2E198_COMPOUND_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'segment $id is a valid notify prompt',
    (_id, row) => {
      expect(isNotifyWhenResultsReadyPrompt(row.notifySegment)).toBe(true);
    },
  );

  it.each(E2E198_COMPOUND_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'decomposes $id with notify_when_results_ready step',
    (_id, row) => {
      const steps = decomposeCustomerClinicCompoundPrompt(row.fullPrompt);
      expect(steps.map((s) => s.action)).toEqual([
        'book_nearest_slot',
        'notify_when_results_ready',
      ]);
      const notify = steps[1];
      expect(notify.params.aspect).toBeTruthy();
      expect(isNotifyWhenResultsReadyPrompt(notify.segment)).toBe(true);
    },
  );

  it.each(E2E198_COMPOUND_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'honors seeded aspect when full prompt is blocked ($id)',
    (_id, row) => {
      const steps = decomposeCustomerClinicCompoundPrompt(row.fullPrompt);
      const seeded = steps[1].params;
      const parsed = parseNotifyWhenResultsReadyFromPrompt(
        row.fullPrompt,
        seeded,
      );
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBeTruthy();
      if (row.expectAspect) {
        expect(parsed?.aspect).toBe(row.expectAspect);
      }
    },
  );

  it.each(E2E198_COMPOUND_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'logic succeeds with step _prompt under full compound prompt ($id)',
    async (_id, row) => {
      const steps = decomposeCustomerClinicCompoundPrompt(row.fullPrompt);
      const notify = steps[1];
      const result = await handleNotifyWhenResultsReadyLogic(
        {
          businessRepo: {
            findOne: jest.fn().mockResolvedValue(clinicBusiness),
          },
        },
        'biz-clinic',
        { ...notify.params, _prompt: notify.segment },
        row.fullPrompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('notify_when_results_ready');
      expect(result.details?.clarify).not.toBe(true);
      expect(String(result.summary)).not.toMatch(/Ask how result-ready/i);
    },
  );

  it.each(E2E198_STANDALONE_NOTIFY_CASES.map((row) => [row.id, row] as const))(
    'standalone $id still detects notify',
    (_id, row) => {
      expect(isNotifyWhenResultsReadyPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(E2E198_NEGATIVE_CASES.map((row) => [row.id, row] as const))(
    'negative $id stays off notify detector',
    (_id, row) => {
      expect(isNotifyWhenResultsReadyPrompt(row.prompt)).toBe(false);
    },
  );
});
