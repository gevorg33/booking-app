import {
  E2E345_NO_SLOTS_DATE_CASES,
  E2E345_SLASH_DATE_RE,
} from './ai-e2e345-public-availability-noslots-slash-date.fixtures.js';
import { composeAvailabilityNoSlotsSummary } from './ai-flexible-availability-check.logic.js';
import { formatDateForAiLabel } from './ai-date-label.util.js';

describe('e2e-bug.345: public check_availability no-slots summary avoids DD/MM slash', () => {
  // Mirrors the exact call shape at public-booking-assistant.service.ts's
  // single-day no-slots branch: daysLabel = formatDateForAiLabel(dateKey, locale).
  it.each(E2E345_NO_SLOTS_DATE_CASES)(
    '$id',
    ({ dateKey, serviceLabel, providerLabel, expectContains, forbidSlash }) => {
      const summary = composeAvailabilityNoSlotsSummary({
        locale: 'en',
        serviceLabel,
        providerLabel,
        daysLabel: formatDateForAiLabel(dateKey, 'en'),
      });
      expect(summary).toContain(expectContains);
      expect(summary).not.toContain(forbidSlash);
      expect(summary).not.toMatch(E2E345_SLASH_DATE_RE);
    },
  );

  it('reproduces the exact reported ticket string shape', () => {
    const summary = composeAvailabilityNoSlotsSummary({
      locale: 'en',
      serviceLabel: 'Swedish massage',
      providerLabel: 'any specialist',
      daysLabel: formatDateForAiLabel('2026-08-04', 'en'),
    });
    expect(summary).toBe(
      'No open slots for Swedish massage with any specialist on the requested day(s) (4 August 2026). Try another day or specialist.',
    );
  });

  it('multi-day count path is unaffected (no date formatting involved)', () => {
    const summary = composeAvailabilityNoSlotsSummary({
      locale: 'en',
      serviceLabel: 'Swedish massage',
      providerLabel: 'any specialist',
      daysLabel: String(3),
    });
    expect(summary).toContain('(3)');
    expect(summary).not.toMatch(E2E345_SLASH_DATE_RE);
  });
});
