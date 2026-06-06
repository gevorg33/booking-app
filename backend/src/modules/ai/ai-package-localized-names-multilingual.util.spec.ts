import { MULTILINGUAL_PACKAGE_LOCALIZED_NAMES_EVAL_SCENARIOS } from './ai-package-localized-names-multilingual.fixtures.js';
import {
  isConfigurePackageLocalizedNamesPrompt,
  parsePackageLocalizedNamesFromPrompt,
  rescuePackageLocalizedNamesIntent,
} from './ai-package-localized-names.util.js';
import {
  isExplainPackageDisplayNamePrompt,
  parsePackageDisplayNameExplainFromPrompt,
  rescuePackageDisplayNameIntent,
} from './ai-package-display-name.util.js';

describe('ai-package-localized-names multilingual (ai-cmd-lang-8)', () => {
  it.each(MULTILINGUAL_PACKAGE_LOCALIZED_NAMES_EVAL_SCENARIOS)(
    'rescues multilingual package localized-name scenario $id',
    ({ prompt, expectedAction, paramsPartial }) => {
      if (expectedAction === 'configure_package_localized_names') {
        expect(isConfigurePackageLocalizedNamesPrompt(prompt)).toBe(true);
        const rescued = rescuePackageLocalizedNamesIntent(prompt, 'unknown');
        expect(rescued?.action).toBe(expectedAction);
        if (paramsPartial?.operation) {
          expect(parsePackageLocalizedNamesFromPrompt(prompt)?.operation).toBe(
            paramsPartial.operation,
          );
        }
        return;
      }

      expect(isExplainPackageDisplayNamePrompt(prompt)).toBe(true);
      expect(rescuePackageDisplayNameIntent(prompt, 'unknown')).toEqual({
        action: 'explain_package_display_name',
        rescueReason: 'explain_package_display_name',
      });
      const parsed = parsePackageDisplayNameExplainFromPrompt(prompt);
      if (paramsPartial?.packageName) {
        expect(parsed?.packageName?.toLowerCase()).toContain(
          String(paramsPartial.packageName).toLowerCase(),
        );
      }
      if (paramsPartial?.locale) {
        expect(parsed?.queryLocale).toBe(paramsPartial.locale);
      }
    },
  );
});
