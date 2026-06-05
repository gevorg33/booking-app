import { describe, expect, it } from 'vitest';
import { mergeProviderVoiceTranscript } from './provider-voice-input.util';

describe('provider-voice-input.util', () => {
  it('merges chunks into assistant input text', () => {
    expect(mergeProviderVoiceTranscript('', 'hello', false)).toEqual({
      merged: 'hello',
      nextBase: '',
    });
    expect(mergeProviderVoiceTranscript('mark', 'all paid', true)).toEqual({
      merged: 'mark all paid',
      nextBase: 'mark all paid',
    });
    expect(mergeProviderVoiceTranscript('base', '   ', false)).toBeNull();
  });
});
