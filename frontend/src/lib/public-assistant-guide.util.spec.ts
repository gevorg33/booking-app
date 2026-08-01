import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS,
  extractPublicAssistantGuidePrefixText,
  resolvePublicAssistantExampleKeys,
} from './public-assistant-guide.util';

describe('public-assistant-guide.util (ai-guide-1.0.3)', () => {
  it('switches example keys when guide chip is active', () => {
    expect(resolvePublicAssistantExampleKeys(false)).not.toEqual(
      resolvePublicAssistantExampleKeys(true),
    );
    expect(resolvePublicAssistantExampleKeys(true)).toEqual(
      PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS,
    );
  });
});

describe('extractPublicAssistantGuidePrefixText (e2e-bug.109)', () => {
  it.each([
    {
      id: 'sign-in-prefix-before-guide-snippet',
      messageText:
        "Sign in to view your appointments.\n\nHere's how to book on this page: Choose a specialist.",
      guideSummary: "Here's how to book on this page: Choose a specialist.",
      expected: 'Sign in to view your appointments.',
    },
    {
      id: 'gift-card-failure-distinct-from-guide',
      messageText: 'Gift card not found.',
      guideSummary: "Here's how to book on this page: Choose a specialist.",
      expected: 'Gift card not found.',
    },
    {
      id: 'support-failure-distinct-from-guide',
      messageText: 'Zendesk is not configured for this business',
      guideSummary: "Here's how to book on this page: Choose a specialist.",
      expected: 'Zendesk is not configured for this business',
    },
    {
      id: 'identical-text-avoids-duplicate',
      messageText: "Here's how to book on this page: Choose a specialist.",
      guideSummary: "Here's how to book on this page: Choose a specialist.",
      expected: '',
    },
    {
      id: 'empty-message',
      messageText: '',
      guideSummary: 'Guide summary',
      expected: '',
    },
    {
      id: 'no-guide-summary-keeps-full-message',
      messageText: 'Status only',
      guideSummary: undefined,
      expected: 'Status only',
    },
    {
      id: 'whitespace-only-message-treated-as-empty',
      messageText: '   \n  ',
      guideSummary: 'Guide summary',
      expected: '',
    },
    {
      id: 'extra-blank-lines-between-prefix-and-summary-are-trimmed',
      messageText: 'Sign in to view your appointments.\n\n\n\n   Guide summary',
      guideSummary: 'Guide summary',
      expected: 'Sign in to view your appointments.',
    },
  ] as const)('keeps prefix for $id', ({ messageText, guideSummary, expected }) => {
    expect(
      extractPublicAssistantGuidePrefixText(messageText, guideSummary),
    ).toBe(expected);
  });
});
