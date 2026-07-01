import type { ExplainAbnormalResultFlagFixture } from './ai-explain-abnormal-result-flag.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainAbnormalResultFlagMultilingualScenario =
  ExplainAbnormalResultFlagFixture & {
    locale: AiEvalLocale;
  };

export const EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian explain abnormal result flag (customer only):
  - explain_abnormal_result_flag: hy «Ինչ է նշանակում բարձր իմ CBC-ում», «Աննորմալը լուրջ է՞»; ru «Что значит высокий в моём CBC», «Насколько серьёзно отклонение». READ measurement flags FAQ — NOT explain_result_status.`;

export const EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS: readonly ExplainAbnormalResultFlagMultilingualScenario[] =
  [
    {
      id: 'high-cbc-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է նշանակում բարձր իմ CBC-ում',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'High',
      testName: 'CBC',
    },
    {
      id: 'serious-hy-customer',
      locale: 'hy',
      prompt: 'Աննորմալը լուրջ է՞',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'seriousness',
      flag: 'Abnormal',
    },
    {
      id: 'reference-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ է նշանակում սահմաններից դուրս արդյունքը',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'reference_range',
    },
    {
      id: 'high-cbc-ru-customer',
      locale: 'ru',
      prompt: 'Что значит высокий показатель в моём CBC',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'flag_meaning',
      flag: 'High',
      testName: 'CBC',
    },
    {
      id: 'serious-ru-customer',
      locale: 'ru',
      prompt: 'Насколько серьёзно отклонение на анализе',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'seriousness',
      flag: 'Abnormal',
    },
    {
      id: 'flags-ru-customer',
      locale: 'ru',
      prompt: 'Что означают флаги измерений в Моих результатах',
      surface: 'customer',
      expectedAction: 'explain_abnormal_result_flag',
      rescueReason: 'abnormal_result_flag',
      aspect: 'general',
    },
  ];
