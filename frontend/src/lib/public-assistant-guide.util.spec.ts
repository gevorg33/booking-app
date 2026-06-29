import { describe, expect, it } from 'vitest';
import {
  PUBLIC_ASSISTANT_GUIDE_EXAMPLE_KEYS,
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
