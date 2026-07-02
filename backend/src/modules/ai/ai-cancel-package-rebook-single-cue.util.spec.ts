import { CANCEL_PACKAGE_REBOOK_SINGLE_NEGATIVE_PROMPTS } from './ai-cancel-package-rebook-single-compound.fixtures.js';
import {
  extractBookSingleServiceFromPrompt,
  hasCancelPackageRebookSingleBookCue,
  hasCancelPackageRebookSinglePackageCue,
  isCancelPackageRebookSingleCompoundCandidate,
} from './ai-cancel-package-rebook-single-cue.util.js';

describe('ai-cancel-package-rebook-single-cue.util (ai-cmd-customer-4.21.7)', () => {
  it('hasCancelPackageRebookSinglePackageCue detects package visit cancel phrasing', () => {
    expect(
      hasCancelPackageRebookSinglePackageCue(
        'Skip package visit 2 and book a trim instead',
      ),
    ).toBe(true);
    expect(hasCancelPackageRebookSinglePackageCue('Book a trim tomorrow')).toBe(
      false,
    );
  });

  it('hasCancelPackageRebookSingleBookCue detects book-instead phrasing', () => {
    expect(
      hasCancelPackageRebookSingleBookCue(
        'Cancel visit 2 of my package and book a haircut instead',
      ),
    ).toBe(true);
    expect(
      hasCancelPackageRebookSingleBookCue(
        'Cancel Friday and book nearest slot',
      ),
    ).toBe(false);
  });

  it('extractBookSingleServiceFromPrompt pulls service from instead phrasing', () => {
    expect(
      extractBookSingleServiceFromPrompt(
        'Skip package visit 2 and book a trim instead',
      ),
    ).toBe('trim');
    expect(
      extractBookSingleServiceFromPrompt(
        'Cancel package visit 3 and book facial instead',
      ),
    ).toBe('facial');
  });

  it('isCancelPackageRebookSingleCompoundCandidate requires both cues', () => {
    expect(
      isCancelPackageRebookSingleCompoundCandidate(
        'Skip package visit 2 and book a trim instead',
      ),
    ).toBe(true);
    expect(
      isCancelPackageRebookSingleCompoundCandidate('Cancel my package visit'),
    ).toBe(false);
  });

  it.each(CANCEL_PACKAGE_REBOOK_SINGLE_NEGATIVE_PROMPTS)(
    'negative prompt $id is not compound candidate',
    ({ prompt }) => {
      expect(isCancelPackageRebookSingleCompoundCandidate(prompt)).toBe(false);
    },
  );
});
