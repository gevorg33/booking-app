import {
  EXPLAIN_PUBLIC_INTAKE_FORM_BOUNDARY_PROMPTS,
  EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS,
  EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS,
} from './ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS } from './ai-explain-public-intake-form-multilingual.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS } from './ai-explain-clinic-booking-fields.fixtures.js';
import { EXPLAIN_CLINIC_BOOKING_PROMPTS } from './ai-clinic-booking.fixtures.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainClinicBookingFieldsPrompt } from './ai-explain-clinic-booking-fields.util.js';
import { isExplainLabPrepPrompt } from './ai-explain-lab-prep.util.js';
import {
  CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES,
  assemblePublicIntakeFormSummary,
  buildExplainPublicIntakeFormNavigate,
  buildPublicIntakeHowItWorksLines,
  buildSignInRequiredLines,
  buildSkipFormLines,
  buildWhatIsFormLines,
  buildWhenShownLines,
  buildWhyQuestionsLines,
  detectExplainPublicIntakeFormAction,
  enrichExplainPublicIntakeFormParamsFromPrompt,
  isExplainPublicIntakeFormIntent,
  isExplainPublicIntakeFormPrompt,
  parseExplainPublicIntakeFormFromPrompt,
  rescueExplainPublicIntakeFormIntent,
  resolveExplainPublicIntakeFormAspect,
  resolvePublicIntakeFormExplainContext,
} from './ai-explain-public-intake-form.util.js';

describe('ai-explain-public-intake-form.util (ai-cmd-customer-4.14.1)', () => {
  it('exports classifier rules for explain_public_intake_form', () => {
    expect(
      CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES,
    ).toContain('explain_public_intake_form');
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain_public_intake_form for $id on $surface', (_id, row) => {
    expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(true);
    const parsed = parseExplainPublicIntakeFormFromPrompt(row.prompt);
    expect(parsed).not.toBeNull();
    if (row.aspect) {
      expect(parsed?.aspect).toBe(row.aspect);
    }
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual public intake form for $id', (_id, row) => {
    expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(true);
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueExplainPublicIntakeFormIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_public_intake_form');
  });

  it.each(
    EXPLAIN_PUBLIC_INTAKE_FORM_BOUNDARY_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('does not steal boundary prompt $id', (_id, row) => {
    expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(false);
  });

  it('extracts aspects, enriches params, and resolves context', () => {
    expect(
      resolveExplainPublicIntakeFormAspect('Why these health questions?'),
    ).toBe('why_questions');
    expect(
      enrichExplainPublicIntakeFormParamsFromPrompt({}, 'Can I skip the form?')
        .aspect,
    ).toBe('skip_form');
    expect(
      resolvePublicIntakeFormExplainContext({
        bookingPhase: 'intake',
        offersPreVisitIntake: true,
        sessionCustomerId: 'cust-1',
        serviceId: 'svc-1',
      }),
    ).toEqual({
      offersPreVisitIntake: true,
      intakeInProgress: true,
      signedIn: true,
      serviceId: 'svc-1',
    });
    expect(
      detectExplainPublicIntakeFormAction('Why these health questions?'),
    ).toBe('explain_public_intake_form');
  });

  it('does not steal clinic checkout, identity, or lab prep prompts', () => {
    for (const row of EXPLAIN_CLINIC_BOOKING_PROMPTS) {
      expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(false);
      expect(isExplainClinicBookingPrompt(row.prompt)).toBe(true);
    }
    for (const row of EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS.slice(0, 3)) {
      expect(isExplainPublicIntakeFormPrompt(row.prompt)).toBe(false);
      expect(isExplainClinicBookingFieldsPrompt(row.prompt)).toBe(true);
    }
    expect(isExplainLabPrepPrompt('Do I need to fast for blood work?')).toBe(
      true,
    );
    expect(
      isExplainPublicIntakeFormPrompt('Do I need to fast for blood work?'),
    ).toBe(false);
    expect(
      rescueExplainPublicIntakeFormIntent(
        'Why these health questions?',
        'explain_public_intake_form',
      ),
    ).toBeNull();
  });

  it('covers heuristic detection paths and guards', () => {
    expect(isExplainPublicIntakeFormPrompt('Why these health questions?')).toBe(
      true,
    );
    expect(isExplainPublicIntakeFormPrompt('')).toBe(false);
    expect(
      resolveExplainPublicIntakeFormAspect(
        'Why do I need to sign in for the questionnaire?',
      ),
    ).toBe('sign_in_required');
    expect(
      resolveExplainPublicIntakeFormAspect('What is the intake questionnaire?'),
    ).toBe('what_is_form');
    expect(
      resolveExplainPublicIntakeFormAspect('When do I see the intake step?'),
    ).toBe('when_shown');
    expect(
      resolveExplainPublicIntakeFormAspect(
        'How does the intake questionnaire work?',
      ),
    ).toBe('how_it_works');
    expect(
      isExplainPublicIntakeFormPrompt(
        'What should I put in the symptoms field on checkout?',
      ),
    ).toBe(false);
    expect(
      isExplainPublicIntakeFormPrompt(
        'Why do you ask for my passport on the clinic intake form?',
      ),
    ).toBe(false);
    expect(
      isExplainPublicIntakeFormPrompt('Ինչու են հարցեր առողջության մասին'),
    ).toBe(true);
  });

  it('covers summary builders, navigation, and context branches', () => {
    const intakeCtx = {
      offersPreVisitIntake: true,
      intakeInProgress: true,
      signedIn: true,
      serviceId: 'svc-lab',
    };
    const noIntakeCtx = {
      offersPreVisitIntake: false,
      intakeInProgress: false,
      signedIn: false,
      serviceId: null,
    };

    expect(buildWhyQuestionsLines(noIntakeCtx).length).toBeGreaterThan(2);
    expect(buildWhyQuestionsLines(intakeCtx).join(' ')).toContain(
      'intake step now',
    );
    expect(buildSkipFormLines(intakeCtx).join(' ')).toContain('Skip for now');
    expect(buildSkipFormLines(noIntakeCtx).join(' ')).toContain(
      'Sign in first',
    );
    expect(buildWhatIsFormLines().join(' ')).toContain(
      'publicIntakeCheckoutTitle',
    );
    expect(buildWhenShownLines(intakeCtx).join(' ')).toContain(
      'offers the pre-visit',
    );
    expect(buildWhenShownLines(noIntakeCtx).join(' ')).toContain(
      'does not offer',
    );
    expect(buildSignInRequiredLines().join(' ')).toContain('customer account');
    expect(buildPublicIntakeHowItWorksLines(intakeCtx).join(' ')).toContain(
      'svc-lab',
    );

    for (const aspect of [
      'why_questions',
      'skip_form',
      'what_is_form',
      'when_shown',
      'sign_in_required',
      'how_it_works',
    ] as const) {
      expect(
        assemblePublicIntakeFormSummary(aspect, intakeCtx).length,
      ).toBeGreaterThan(20);
    }

    expect(
      buildExplainPublicIntakeFormNavigate('skip_form', intakeCtx),
    ).toEqual({
      path: 'book',
      query: { serviceId: 'svc-lab' },
    });
    expect(
      buildExplainPublicIntakeFormNavigate('sign_in_required', intakeCtx),
    ).toBeNull();
    expect(
      buildExplainPublicIntakeFormNavigate('why_questions', {
        ...intakeCtx,
        serviceId: null,
      }),
    ).toEqual({ path: 'book', query: {} });
  });

  it('covers intent helpers and param enrichment edge cases', () => {
    expect(isExplainPublicIntakeFormIntent('explain_public_intake_form')).toBe(
      true,
    );
    expect(isExplainPublicIntakeFormIntent('unknown')).toBe(false);
    expect(
      parseExplainPublicIntakeFormFromPrompt('Why these health questions?', {
        aspect: 'skip_form',
      })?.aspect,
    ).toBe('skip_form');
    expect(
      enrichExplainPublicIntakeFormParamsFromPrompt(
        { foo: 'bar' },
        'Book a haircut tomorrow',
      ),
    ).toEqual({ foo: 'bar' });
    expect(
      resolvePublicIntakeFormExplainContext({
        preVisitIntakeEnabled: false,
        onIntakeStep: true,
        signedIn: false,
      }),
    ).toEqual({
      offersPreVisitIntake: false,
      intakeInProgress: true,
      signedIn: false,
      serviceId: null,
    });
  });
});
