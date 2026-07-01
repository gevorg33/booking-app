import {
  CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES,
  EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
  EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS,
} from './ai-explain-abnormal-result-flag.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS } from './ai-explain-abnormal-result-flag-multilingual.fixtures.js';
import { EXPLAIN_RESULT_STATUS_PROMPTS } from './ai-consumer-clinic-test-results.fixtures.js';
import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';
import {
  assembleAbnormalResultFlagSummary,
  enrichExplainAbnormalResultFlagParamsFromPrompt,
  extractMeasurementFlagFromPrompt,
  isExplainAbnormalResultFlagIntent,
  isExplainAbnormalResultFlagPrompt,
  parseExplainAbnormalResultFlagFromPrompt,
  rescueExplainAbnormalResultFlagIntent,
  resolveExplainAbnormalResultFlagAspect,
  buildExplainAbnormalResultFlagNavigate,
  formatMeasurementFlagExplanation,
} from './ai-explain-abnormal-result-flag.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_ABNORMAL_RESULT_FLAG_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-abnormal-result-flag.util (ai-cmd-customer-4.14.6)', () => {
  it('exports classifier rules for explain_abnormal_result_flag', () => {
    expect(CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES).toContain(
      'explain_abnormal_result_flag',
    );
    expect(CUSTOMER_EXPLAIN_ABNORMAL_RESULT_FLAG_CLASSIFIER_RULES).toContain(
      'NOT explain_result_status',
    );
  });

  it.each(EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS)(
    'detects explain_abnormal_result_flag for $id',
    ({ prompt, flag, aspect }) => {
      expect(isExplainAbnormalResultFlagPrompt(prompt)).toBe(true);
      const parsed = parseExplainAbnormalResultFlagFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (flag) expect(parsed?.flag).toBe(flag);
      if (aspect) expect(parsed?.aspect).toBe(aspect);
    },
  );

  it.each(EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS)(
    'detects multilingual explain_abnormal_result_flag for $id',
    ({ prompt }) => {
      expect(isExplainAbnormalResultFlagPrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_ABNORMAL_RESULT_FLAG_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainAbnormalResultFlagIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it.each(EXPLAIN_RESULT_STATUS_PROMPTS.slice(0, 6))(
    'does not treat result status prompt $id as flag FAQ',
    ({ prompt }) => {
      expect(isExplainAbnormalResultFlagPrompt(prompt)).toBe(false);
      expect(isExplainResultStatusPrompt(prompt)).toBe(true);
    },
  );

  it('extracts flags and enriches params', () => {
    expect(extractMeasurementFlagFromPrompt('What does high mean?')).toBe(
      'High',
    );
    expect(
      enrichExplainAbnormalResultFlagParamsFromPrompt(
        {},
        'Is abnormal serious?',
      ).flag,
    ).toBe('Abnormal');
  });

  it('assembles summaries with medical disclaimer', () => {
    const summary = assembleAbnormalResultFlagSummary({
      aspect: 'seriousness',
      flag: 'Abnormal',
    });
    expect(summary).toContain('not medical advice');
    expect(summary).toContain('Abnormal');
  });

  it('builds navigate to results', () => {
    expect(buildExplainAbnormalResultFlagNavigate('CBC')).toEqual({
      path: '/results',
      query: { section: 'my-results' },
    });
  });

  it('recognizes intent and eval cases', () => {
    expect(
      isExplainAbnormalResultFlagIntent('explain_abnormal_result_flag'),
    ).toBe(true);
    expect(
      AI_COMMAND_EVAL_EXPLAIN_ABNORMAL_RESULT_FLAG_CASES.length,
    ).toBeGreaterThan(20);
  });

  it('does not rescue when action already matches', () => {
    expect(
      rescueExplainAbnormalResultFlagIntent(
        'What does high mean on my CBC?',
        'explain_abnormal_result_flag',
      ),
    ).toBeNull();
  });

  it('covers additional flag extraction and aspect branches', () => {
    expect(extractMeasurementFlagFromPrompt('Inconclusive lab value')).toBe(
      'Inconclusive',
    );
    expect(extractMeasurementFlagFromPrompt('Indeterminate reading')).toBe(
      'Indeterminate',
    );
    expect(extractMeasurementFlagFromPrompt('What does low mean here?')).toBe(
      'Low',
    );
    expect(
      extractMeasurementFlagFromPrompt(
        'What does normal mean on my reference range flag?',
      ),
    ).toBe('Normal');
    expect(
      extractMeasurementFlagFromPrompt('Value is out of reference range'),
    ).toBe('Abnormal');
    expect(extractMeasurementFlagFromPrompt('SeeDetails on measurement')).toBe(
      'SeeDetails',
    );
    expect(resolveExplainAbnormalResultFlagAspect('should I worry')).toBe(
      'seriousness',
    );
    expect(
      resolveExplainAbnormalResultFlagAspect('what is the reference range'),
    ).toBe('reference_range');
    expect(
      resolveExplainAbnormalResultFlagAspect(
        'what are measurement flags on my results',
      ),
    ).toBe('general');
    expect(isExplainAbnormalResultFlagPrompt('')).toBe(false);
    expect(isExplainAbnormalResultFlagPrompt('high value only')).toBe(false);
    expect(
      isExplainAbnormalResultFlagPrompt(
        'What does released mean for my lab results?',
      ),
    ).toBe(false);
    expect(
      isExplainAbnormalResultFlagPrompt('Upload referral document for patient'),
    ).toBe(false);
    expect(
      assembleAbnormalResultFlagSummary({
        aspect: 'reference_range',
      }),
    ).toContain('Reference ranges');
    expect(
      assembleAbnormalResultFlagSummary({
        aspect: 'general',
      }),
    ).toContain('My Results shows measurement flags');
    expect(
      assembleAbnormalResultFlagSummary({
        aspect: 'flag_meaning',
        testName: 'CBC',
      }),
    ).toContain('Open your CBC result');
    expect(
      assembleAbnormalResultFlagSummary({
        aspect: 'flag_meaning',
      }),
    ).toContain('Measurement flags on lab results');
    expect(formatMeasurementFlagExplanation('High', 'en', 'CBC')).toContain(
      'CBC',
    );
    expect(
      parseExplainAbnormalResultFlagFromPrompt(
        'What does high mean on my CBC?',
        {
          flag: 'Low',
        },
      )?.flag,
    ).toBe('Low');
  });
});
