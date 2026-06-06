import { EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS } from './ai-package-display-name.fixtures.js';
import { isExplainBookingLanguagesPrompt } from './ai-booking-languages.util.js';
import {
  isExplainPackageDisplayNamePrompt,
  parsePackageDisplayNameExplainFromPrompt,
  rescuePackageDisplayNameIntent,
} from './ai-package-display-name.util.js';

describe('ai-package-display-name.util (ai-cmd-lang-7)', () => {
  it.each(EXPLAIN_PACKAGE_DISPLAY_NAME_PROMPTS)(
    'detects explain package display name prompt $id',
    ({ prompt, packageName, locale }) => {
      expect(isExplainPackageDisplayNamePrompt(prompt)).toBe(true);
      expect(isExplainBookingLanguagesPrompt(prompt)).toBe(false);

      const parsed = parsePackageDisplayNameExplainFromPrompt(prompt);
      expect(parsed?.packageName?.toLowerCase()).toContain(
        packageName.toLowerCase(),
      );
      if (locale) expect(parsed?.queryLocale).toBe(locale);
    },
  );

  it('rescues misclassified package display name prompts', () => {
    expect(
      rescuePackageDisplayNameIntent(
        'What name do Russian visitors see for the Spa Day package on public booking?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_package_display_name',
      rescueReason: 'explain_package_display_name',
    });
  });

  it('does not rescue when action is already explain_package_display_name', () => {
    expect(
      rescuePackageDisplayNameIntent(
        'What title does the Bridal package show here?',
        'explain_package_display_name',
      ),
    ).toBeNull();
  });

  it('does not steal configure package localized name prompts', () => {
    expect(
      isExplainPackageDisplayNamePrompt(
        'Add Armenian name «Սպա օր» for Spa Day package',
      ),
    ).toBe(false);
  });
});
