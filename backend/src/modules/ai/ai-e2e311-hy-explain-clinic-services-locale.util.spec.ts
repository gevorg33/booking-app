import { t } from '../../common/i18n/messages.js';
import { isAiDateGroundedBookingAction } from './ai-date-label.util.js';
import {
  buildExplainClinicServicesSummary,
  handleExplainClinicServicesLogic,
  resolveExplainClinicServicesLocale,
} from './ai-clinic-service.logic.js';
import {
  E2E311_LOCALE_RESOLVE_CASES,
  E2E311_SKIP_ENRICH_ACTION,
} from './ai-e2e311-hy-explain-clinic-services-locale.fixtures.js';

describe('e2e-bug.311 HY explain_clinic_services empty locale', () => {
  const emptyDeps = () => ({
    serviceService: {
      findAll: jest.fn(async () => [
        {
          id: 'svc-massage',
          name: 'Relaxation Massage',
          metadata: {},
          category: { name: 'Spa' },
        },
      ]),
      update: jest.fn(),
    },
  });

  it.each(
    E2E311_LOCALE_RESOLVE_CASES.map((row) => [row.id, row] as const),
  )('%s — resolve locale from prompt script', (_id, row) => {
    expect(
      resolveExplainClinicServicesLocale(
        row.paramsLocale ? { locale: row.paramsLocale } : {},
        row.prompt,
      ),
    ).toBe(row.expectedLocale);
  });

  it.each(
    E2E311_LOCALE_RESOLVE_CASES.map((row) => [row.id, row] as const),
  )('%s — empty summary localized', async (_id, row) => {
    const result = await handleExplainClinicServicesLogic(
      emptyDeps(),
      'biz-salon',
      row.paramsLocale ? { locale: row.paramsLocale } : {},
      row.prompt,
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('explain_clinic_services');
    expect(result.summary).toMatch(row.expectEmptyMatch);
    expect(result.details?.locale).toBe(row.expectedLocale);
    if (row.forbidEnglishEmpty) {
      expect(result.summary).not.toMatch(
        /No clinic catalog services are currently available/i,
      );
    }
  });

  it('buildExplainClinicServicesSummary uses hy empty copy', () => {
    const summary = buildExplainClinicServicesSummary(
      {},
      [],
      {
        total: 0,
        consultation: 0,
        labTest: 0,
        procedure: 0,
        unclassified: 0,
        fastingLabTests: 0,
        departments: [],
      },
      'hy',
    );
    expect(summary).toBe(t('hy', 'assistant.clinicServicesEmpty', { filterNote: '' }));
    expect(summary).toMatch(/կլինիկական կատալոգում/i);
  });

  it('isAiDateGroundedBookingAction skips enrich for explain_clinic_services', () => {
    expect(isAiDateGroundedBookingAction(E2E311_SKIP_ENRICH_ACTION)).toBe(
      true,
    );
  });

  it('documents scenario ids', () => {
    expect(E2E311_LOCALE_RESOLVE_CASES.map((c) => c.id)).toEqual([
      'hy-lab-fasting-prompt',
      'hy-consultation-count-bug-repro',
      'hy-explain-services',
      'hy-department-counts',
      'ru-consultation-count',
      'ru-fasting-labs',
      'en-fasting-labs',
      'en-explain-clinic',
    ]);
  });
});
