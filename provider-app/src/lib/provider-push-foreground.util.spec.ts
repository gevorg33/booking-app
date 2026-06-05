import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import {
  foregroundPushMessage,
  showForegroundPushBanner,
} from './provider-push-foreground.util';
import { PROVIDER_AI_PROMPT_EVENT } from './provider-push-deep-link.util';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

type ToastOptions = {
  action?: { label: string; onClick: () => void };
  cancel?: { label: string; onClick: () => void };
};

describe('provider-push-foreground.util', () => {
  it('prefers foreground hint over notification body', () => {
    expect(
      foregroundPushMessage(
        { foregroundHint: 'New booking 14:00 — Add buffer?' },
        { body: 'Other body' },
      ),
    ).toBe('New booking 14:00 — Add buffer?');
    expect(foregroundPushMessage({}, { body: 'Body only' })).toBe('Body only');
  });

  it('falls back to notification title and plain toast', () => {
    expect(foregroundPushMessage({}, {})).toBe('New notification');
    expect(foregroundPushMessage({}, { title: 'Alert' })).toBe('Alert');
    showForegroundPushBanner({ pushType: 'end_of_day' }, { addBufferAction: 'AI', dismiss: 'X' }, {
      body: 'Summary',
    });
    expect(toast).toHaveBeenCalledWith('Summary', { duration: 8000 });
  });

  it('shows actionable toast and dispatches AI prompt on action click', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    showForegroundPushBanner(
      {
        foregroundHint: 'New booking 14:00 — Add buffer?',
        aiPrompt: 'Add a buffer before 14:00',
        pushType: 'booking_created',
      },
      { addBufferAction: 'Add buffer with AI', dismiss: 'Dismiss' },
    );
    const opts = vi.mocked(toast).mock.calls.at(-1)?.[1] as ToastOptions | undefined;
    expect(opts?.action?.label).toBe('Add buffer with AI');
    opts?.action?.onClick();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: PROVIDER_AI_PROMPT_EVENT }),
    );
    opts?.cancel?.onClick();
    dispatchSpy.mockRestore();
  });
});
