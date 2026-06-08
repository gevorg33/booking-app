import { describe, expect, it } from 'vitest';
import { translate } from '@shared-i18n/translate';
import { getMessages } from '../i18n/catalog';
import { buildProviderAiExamples } from './provider-ai-examples';

describe('buildProviderAiExamples', () => {
  it('returns example prompts from the catalog including push setup', () => {
    const en = getMessages('en');
    const examples = buildProviderAiExamples((key) => translate(en, key));
    expect(examples).toEqual([
      translate(en, 'provider.exampleSickCancel'),
      translate(en, 'provider.exampleMarkJohn'),
      translate(en, 'provider.exampleMarkAllPaid'),
      translate(en, 'provider.exampleScheduleToday'),
      translate(en, 'provider.exampleCountAppointmentsTomorrow'),
      translate(en, 'provider.exampleRevenueLastWeek'),
      translate(en, 'provider.exampleExplainPushSetup'),
      translate(en, 'provider.exampleEnablePush'),
    ]);
  });
});
