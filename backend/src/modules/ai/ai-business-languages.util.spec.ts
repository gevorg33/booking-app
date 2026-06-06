import {
  BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS,
  CONFIGURE_BUSINESS_LANGUAGES_PROMPTS,
  EXPLAIN_BUSINESS_LANGUAGES_PROMPTS,
} from './ai-business-languages.fixtures.js';
import { MULTILINGUAL_BUSINESS_LANGUAGES_EVAL_SCENARIOS } from './ai-business-languages-multilingual.fixtures.js';
import {
  isConfigureBusinessLanguagesPrompt,
  isExplainBusinessLanguagesPrompt,
  isBulkStripDisabledLocaleTranslationsPrompt,
  isBusinessLanguagesIntent,
  parseBusinessLanguagesFromPrompt,
  rescueBusinessLanguagesIntent,
  rescueExplainBusinessLanguagesIntent,
  rescueBulkStripDisabledLocaleTranslationsIntent,
} from './ai-business-languages.util.js';

describe('ai-business-languages.util (ai-cmd-lang-1)', () => {
  it.each(CONFIGURE_BUSINESS_LANGUAGES_PROMPTS)(
    'detects configure business languages prompt $id',
    ({ prompt, operation, locales }) => {
      expect(isConfigureBusinessLanguagesPrompt(prompt)).toBe(true);
      expect(parseBusinessLanguagesFromPrompt(prompt)).toEqual({
        operation,
        locales: [...locales],
      });
    },
  );

  it.each(BULK_STRIP_DISABLED_LOCALE_TRANSLATIONS_PROMPTS)(
    'detects bulk strip disabled locale translations prompt $id',
    ({ prompt }) => {
      expect(isBulkStripDisabledLocaleTranslationsPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessLanguagesPrompt(prompt)).toBe(false);
      expect(isExplainBusinessLanguagesPrompt(prompt)).toBe(false);
    },
  );

  it.each(EXPLAIN_BUSINESS_LANGUAGES_PROMPTS)(
    'detects explain business languages prompt $id',
    ({ prompt }) => {
      expect(isExplainBusinessLanguagesPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessLanguagesPrompt(prompt)).toBe(false);
    },
  );

  it('does not classify catalog translation creation as language configuration', () => {
    expect(
      isConfigureBusinessLanguagesPrompt(
        'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian',
      ),
    ).toBe(false);
  });

  it('does not classify currency configuration as language configuration', () => {
    expect(isConfigureBusinessLanguagesPrompt('Set default currency to AMD')).toBe(
      false,
    );
    expect(parseBusinessLanguagesFromPrompt('Set default currency to AMD')).toBeNull();
  });

  it('does not rescue when action is already configure_business_languages', () => {
    expect(
      rescueBusinessLanguagesIntent(
        'Enable Armenian and Russian',
        'configure_business_languages',
      ),
    ).toBeNull();
  });

  it('does not classify turn off language as bulk strip cleanup', () => {
    expect(
      isBulkStripDisabledLocaleTranslationsPrompt(
        'Turn off Russian for our salon',
      ),
    ).toBe(false);
  });

  it('rescues misclassified bulk strip prompts', () => {
    expect(
      rescueBulkStripDisabledLocaleTranslationsIntent(
        'Strip translations for disabled locales from our catalog',
        'unknown',
      ),
    ).toEqual({
      action: 'bulk_strip_disabled_locale_translations',
      rescueReason: 'bulk_strip_disabled_locale_translations',
    });
  });

  it('rescues misclassified language explain prompts', () => {
    expect(
      rescueExplainBusinessLanguagesIntent(
        'What languages are enabled for our salon?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_business_languages',
      rescueReason: 'explain_business_languages',
    });
  });

  it('rescues misclassified language configuration prompts', () => {
    expect(
      rescueBusinessLanguagesIntent('Enable Armenian and Russian', 'unknown'),
    ).toEqual({
      action: 'configure_business_languages',
      rescueReason: 'configure_business_languages',
    });
  });

  it.each(MULTILINGUAL_BUSINESS_LANGUAGES_EVAL_SCENARIOS)(
    'rescues multilingual business language scenario $id (ai-cmd-lang-4)',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'configure_business_languages') {
        const rescued = rescueBusinessLanguagesIntent(prompt, 'unknown');
        expect(rescued?.action).toBe(expectedAction);
        if (paramsPartial?.operation) {
          expect(parseBusinessLanguagesFromPrompt(prompt)?.operation).toBe(
            paramsPartial.operation,
          );
        }
        return;
      }

      expect(rescueExplainBusinessLanguagesIntent(prompt, 'unknown')).toEqual({
        action: 'explain_business_languages',
        rescueReason: 'explain_business_languages',
      });
    },
  );

  it('recognizes business languages intent ids', () => {
    expect(isBusinessLanguagesIntent('configure_business_languages')).toBe(true);
    expect(isBusinessLanguagesIntent('explain_business_languages')).toBe(true);
    expect(
      isBusinessLanguagesIntent('bulk_strip_disabled_locale_translations'),
    ).toBe(true);
  });
});
