import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import {
  EXPLAIN_PATIENT_ALERT_PROMPTS,
  EXPLAIN_PATIENT_ALERT_BOUNDARY_PROMPTS,
  EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES,
} from './ai-explain-patient-alert.fixtures.js';
import { EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS } from './ai-explain-patient-alert-multilingual.fixtures.js';
import {
  assemblePatientAlertSummary,
  buildDismissAlertLines,
  buildExplainPatientAlertNavigate,
  buildIntakeIncompleteLines,
  buildLabBookingPendingLines,
  buildResultsReadyLines,
  buildWhatIsBannerLines,
  buildWhatToDoLines,
  isExplainPatientAlertIntent,
  isExplainPatientAlertPrompt,
  parseExplainPatientAlertFromPrompt,
  rescueExplainPatientAlertIntent,
  resolveConsumerPatientAlertExplainContext,
  resolveExplainPatientAlertAspect,
  resolveExplainPatientAlertType,
  shouldDismissConsumerPatientAlert,
} from './ai-explain-patient-alert.util.js';
import { isBookLabCollectionPrompt } from './ai-clinic-lab-booking.util.js';
import { isListMyTestResultsPrompt } from './ai-consumer-clinic-test-results.util.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_PATIENT_ALERT_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-patient-alert.util (ai-cmd-customer-4.14.3)', () => {
  it('exports classifier rules for explain_patient_alert', () => {
    expect(CUSTOMER_EXPLAIN_PATIENT_ALERT_CLASSIFIER_RULES).toContain(
      'explain_patient_alert',
    );
  });

  it.each(EXPLAIN_PATIENT_ALERT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain_patient_alert for $id',
    (_id, row) => {
      expect(isExplainPatientAlertPrompt(row.prompt)).toBe(true);
      expect(
        rescueExplainPatientAlertIntent(row.prompt, 'unknown')?.action,
      ).toBe('explain_patient_alert');
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'explain_patient_alert',
      );
    },
  );

  it.each(
    EXPLAIN_PATIENT_ALERT_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual explain_patient_alert for $id', (_id, row) => {
    expect(isExplainPatientAlertPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_PATIENT_ALERT_BOUNDARY_PROMPTS.map((row) => [row.id, row] as const),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isExplainPatientAlertPrompt(row.prompt)).toBe(false);
  });

  it.each(EXPLAIN_PATIENT_ALERT_RESCUE_SCENARIOS)(
    'rescues explain_patient_alert for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainPatientAlertIntent(prompt, misclassifiedAction)?.action,
      ).toBe('explain_patient_alert');
    },
  );

  it('resolves aspects, context, and summaries', () => {
    expect(resolveExplainPatientAlertAspect('What is this red banner?')).toBe(
      'what_is_banner',
    );
    const ctx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'TestResultReleased:r1',
          type: 'TestResultReleased',
          sourceId: 'r1',
          bookingId: 'b1',
          title: 'New result',
          messages: [{ title: 'CBC ready' }],
          chartTab: 'results',
          createdAt: '2026-06-01T00:00:00.000Z',
          testName: 'CBC',
        },
      ],
      patientAlertCount: 1,
    });
    expect(ctx.alertCount).toBe(1);
    expect(ctx.primaryAlert?.testName).toBe('CBC');
    expect(
      assemblePatientAlertSummary('results_ready', ctx, 'TestResultReleased'),
    ).toContain('CBC');
    expect(buildWhatIsBannerLines(ctx)[2]).toContain('Dismiss');
    expect(buildResultsReadyLines(ctx, 'TestResultReleased')[0]).toContain(
      'TestResultReleased',
    );
    expect(buildIntakeIncompleteLines(ctx)[2]).toContain('account intake');
    expect(buildLabBookingPendingLines(ctx)[0]).toContain(
      'LabBookingRequestPending',
    );
    expect(buildDismissAlertLines()[0]).toContain('dismiss');
  });

  it('parses prompt and recognizes intent id', () => {
    expect(
      parseExplainPatientAlertFromPrompt('Results ready — what do I do?')
        ?.aspect,
    ).toBe('results_ready');
    expect(isExplainPatientAlertIntent('explain_patient_alert')).toBe(true);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueExplainPatientAlertIntent(
        'What is this red banner?',
        'explain_patient_alert',
      ),
    ).toBeNull();
  });

  it('does not steal list, book, or intake checkout prompts', () => {
    expect(isListMyTestResultsPrompt('Show my test results')).toBe(true);
    expect(isExplainPatientAlertPrompt('Show my test results')).toBe(false);
    expect(isBookLabCollectionPrompt('Book my lab collection')).toBe(true);
    expect(isExplainPatientAlertPrompt('Book my lab collection')).toBe(false);
    expect(isExplainPublicIntakeFormPrompt('Why these health questions?')).toBe(
      true,
    );
    expect(isExplainPatientAlertPrompt('Why these health questions?')).toBe(
      false,
    );
    expect(isExplainPatientAlertPrompt('Results ready — what do I do?')).toBe(
      true,
    );
  });

  it('builds navigate and dismiss client action', () => {
    const ctx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'LabBookingRequestPending:o1',
          type: 'LabBookingRequestPending',
          sourceId: 'o1',
          bookingId: null,
          title: 'Book collection',
          messages: [],
          chartTab: 'orders',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    });
    expect(
      buildExplainPatientAlertNavigate('lab_booking_pending', null, ctx),
    ).toEqual({ path: '/lab-to-book', query: {} });
    expect(
      buildExplainPatientAlertNavigate(
        'intake_incomplete',
        'IntakeIncomplete',
        ctx,
      ),
    ).toEqual({ path: 'account', query: { section: 'my-intake' } });
    expect(
      buildExplainPatientAlertNavigate(
        'results_ready',
        'TestResultReleased',
        ctx,
      ),
    ).toEqual({ path: '/results', query: {} });
    expect(shouldDismissConsumerPatientAlert('dismiss_alert')).toBe(true);
    expect(
      buildExplainPatientAlertNavigate('dismiss_alert', null, ctx),
    ).toBeNull();
  });

  it('rejects empty prompt', () => {
    expect(isExplainPatientAlertPrompt('')).toBe(false);
  });

  it('registers eval cases', () => {
    expect(AI_COMMAND_EVAL_EXPLAIN_PATIENT_ALERT_CASES.length).toBeGreaterThan(
      0,
    );
  });

  it('covers aspect branches, builders, and valid alert parsing', () => {
    expect(
      resolveExplainPatientAlertAspect('How do clinic patient alerts work?'),
    ).toBe('how_it_works');
    expect(
      resolveExplainPatientAlertAspect(
        'Why does it say lab collection to book?',
      ),
    ).toBe('lab_booking_pending');
    expect(
      resolveExplainPatientAlertAspect('How do I dismiss the patient alert?'),
    ).toBe('dismiss_alert');
    expect(
      resolveExplainPatientAlertAspect(
        'What should I do about the clinic alerts?',
      ),
    ).toBe('what_to_do');

    const intakeCtx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'IntakeIncomplete:i1',
          type: 'IntakeIncomplete',
          sourceId: 'i1',
          bookingId: 'b2',
          title: 'Finish intake',
          messages: [{ title: 'Pre-visit form' }],
          chartTab: 'intake',
          createdAt: '2026-06-01T00:00:00.000Z',
          questionnaireTitle: 'Pre-visit',
        },
      ],
    });
    expect(buildIntakeIncompleteLines(intakeCtx).join(' ')).toContain(
      'Pre-visit',
    );
    expect(
      assemblePatientAlertSummary('how_it_works', intakeCtx, null),
    ).toContain('ConsumerPatientAlertsBanner');
    expect(
      assemblePatientAlertSummary('what_to_do', intakeCtx, null),
    ).toContain('IntakeIncomplete');
    expect(
      assemblePatientAlertSummary('dismiss_alert', intakeCtx, null),
    ).toContain('dismiss');
    expect(
      assemblePatientAlertSummary('lab_booking_pending', intakeCtx, null),
    ).toContain('LabBookingRequestPending');

    const parsedCtx = resolveConsumerPatientAlertExplainContext({
      patientAlertCount: 2,
      patientAlerts: [
        {
          id: 'TestResultReleased:r2',
          type: 'TestResultReleased',
          sourceId: 'r2',
          bookingId: null,
          title: 'Result',
          messages: [{ title: 'Ready' }],
          chartTab: 'results',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    });
    expect(parsedCtx.alertCount).toBe(2);
    expect(
      buildExplainPatientAlertNavigate('what_is_banner', null, parsedCtx),
    ).toEqual({
      path: '/results',
      query: {},
    });
  });

  it('covers heuristic multilingual and empty alert context branches', () => {
    expect(isExplainPatientAlertPrompt('Ինչ է այս կարմիր բաները')).toBe(true);
    expect(isExplainPatientAlertPrompt('Что это за красный баннер?')).toBe(
      true,
    );
    const emptyCtx = resolveConsumerPatientAlertExplainContext({});
    expect(buildWhatIsBannerLines(emptyCtx)[3]).toContain('No active');
    expect(
      buildResultsReadyLines(emptyCtx, 'TestResultReleased').length,
    ).toBeGreaterThan(1);
    expect(
      buildExplainPatientAlertNavigate('what_is_banner', null, emptyCtx),
    ).toBeNull();
    expect(
      buildExplainPatientAlertNavigate('what_to_do', null, {
        ...emptyCtx,
        alertCount: 2,
        activeTypes: ['TestResultReleased'],
      }),
    ).toEqual({ path: 'home', query: {} });
  });

  it('parses partial patient alert payloads safely', () => {
    const ctx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [{ type: 'bad', id: 'x' }, null, 'text'],
    });
    expect(ctx.activeAlerts).toHaveLength(0);

    const invalidChart = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'x',
          type: 'TestResultReleased',
          sourceId: 'x',
          bookingId: null,
          title: 'Bad tab',
          messages: [],
          chartTab: 'invalid',
          createdAt: '2026-06-01T00:00:00.000Z',
        },
      ],
    });
    expect(invalidChart.activeAlerts).toHaveLength(0);
  });

  it('covers steal guards, lab order labels, and primary alert navigation', () => {
    const labCtx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'LabBookingRequestPending:o2',
          type: 'LabBookingRequestPending',
          sourceId: 'o2',
          bookingId: null,
          title: 'Book draw',
          messages: [],
          chartTab: 'orders',
          createdAt: '2026-06-01T00:00:00.000Z',
          orderDisplayNames: 'CBC, BMP',
        },
      ],
    });
    expect(buildLabBookingPendingLines(labCtx).join(' ')).toContain('CBC, BMP');

    const serviceCtx = resolveConsumerPatientAlertExplainContext({
      patientAlerts: [
        {
          id: 'LabBookingRequestPending:o3',
          type: 'LabBookingRequestPending',
          sourceId: 'o3',
          bookingId: null,
          title: 'Book draw',
          messages: [],
          chartTab: 'orders',
          createdAt: '2026-06-01T00:00:00.000Z',
          collectionServiceName: 'Blood draw',
        },
      ],
    });
    expect(buildLabBookingPendingLines(serviceCtx).join(' ')).toContain(
      'Blood draw',
    );
    expect(
      buildWhatToDoLines({
        alertCount: 0,
        activeAlerts: [],
        activeTypes: [],
        primaryAlert: null,
      })[1],
    ).toContain('GET /me/clinic-patient-alerts');
    expect(
      buildExplainPatientAlertNavigate(
        'what_to_do',
        null,
        labCtx.primaryAlert
          ? labCtx
          : {
              alertCount: 1,
              activeAlerts: labCtx.activeAlerts,
              activeTypes: ['LabBookingRequestPending'],
              primaryAlert: labCtx.activeAlerts[0] ?? null,
            },
      ),
    ).toEqual({ path: '/lab-to-book', query: {} });
    expect(
      isExplainPatientAlertPrompt('What is the status of my results?'),
    ).toBe(false);
    expect(
      resolveExplainPatientAlertType('What is the pre-visit intake alert?'),
    ).toBe('IntakeIncomplete');
    expect(
      assemblePatientAlertSummary('what_is_banner', labCtx, null),
    ).toContain('amber');
  });
});
