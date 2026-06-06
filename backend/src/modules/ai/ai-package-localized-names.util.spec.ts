import { CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS } from './ai-package-localized-names.fixtures.js';
import {
  isConfigurePackageLocalizedNamesPrompt,
  parsePackageLocalizedNamesFromPrompt,
  rescuePackageLocalizedNamesIntent,
} from './ai-package-localized-names.util.js';
import { isConfigureBusinessLanguagesPrompt } from './ai-business-languages.util.js';

describe('ai-package-localized-names.util (ai-cmd-lang-6)', () => {
  it.each(CONFIGURE_PACKAGE_LOCALIZED_NAMES_PROMPTS)(
    'detects configure package localized names prompt $id',
    ({ prompt, operation, packageName, locale, displayName }) => {
      expect(isConfigurePackageLocalizedNamesPrompt(prompt)).toBe(true);
      expect(isConfigureBusinessLanguagesPrompt(prompt)).toBe(false);

      const parsed = parsePackageLocalizedNamesFromPrompt(prompt);
      expect(parsed?.operation).toBe(operation);
      expect(parsed?.packageName?.toLowerCase()).toContain(
        packageName.toLowerCase(),
      );
      if (locale) expect(parsed?.locale).toBe(locale);
      if (displayName) expect(parsed?.displayName).toBe(displayName);
    },
  );

  it('rescues misclassified package localized name prompts', () => {
    expect(
      rescuePackageLocalizedNamesIntent(
        'Add Armenian name «Սպա օր» for Spa Day package',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_package_localized_names',
      rescueReason: 'configure_package_localized_names',
    });
  });

  it('does not rescue when action is already configure_package_localized_names', () => {
    expect(
      rescuePackageLocalizedNamesIntent(
        'Clear Armenian localized name for Spa Day package',
        'configure_package_localized_names',
      ),
    ).toBeNull();
  });

  it('does not steal bulk category translation creation prompts', () => {
    expect(
      isConfigurePackageLocalizedNamesPrompt(
        'We are adding a new Nails category, create 10 linked services and add translations in Armenian and Russian',
      ),
    ).toBe(false);
  });
});
