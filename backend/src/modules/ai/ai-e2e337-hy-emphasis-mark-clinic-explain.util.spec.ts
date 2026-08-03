import {
  E2E337_CLINIC_EMPHASIS_CASES,
  E2E337_HOURS_AND_OTHER_IMPERATIVE_CONTROL_CASES,
} from './ai-e2e337-hy-emphasis-mark-clinic-explain.fixtures.js';
import { isExplainClinicServicesPrompt } from './ai-clinic-service.util.js';
import { isExplainBusinessHoursAndLocationPrompt } from './ai-explain-business-hours-and-location.util.js';

describe('e2e-bug.337: Armenian ՛ emphasis mark must not defeat the hours-cue exclusion guard', () => {
  it.each(
    E2E337_CLINIC_EMPHASIS_CASES.map((row) => [row.id, row] as const),
  )('%s', (_id, row) => {
    expect(isExplainClinicServicesPrompt(row.prompt)).toBe(
      row.expectClinicExplain,
    );
    expect(isExplainBusinessHoursAndLocationPrompt(row.prompt)).toBe(
      row.expectHoursExplain,
    );
  });

  it.each(
    E2E337_HOURS_AND_OTHER_IMPERATIVE_CONTROL_CASES.map(
      (row) => [row.id, row] as const,
    ),
  )('%s', (_id, row) => {
    expect(isExplainClinicServicesPrompt(row.prompt)).toBe(
      row.expectClinicExplain,
    );
    expect(isExplainBusinessHoursAndLocationPrompt(row.prompt)).toBe(
      row.expectHoursExplain,
    );
  });
});
