import { describe, expect, it, jest } from '@jest/globals';
import { AiSettingsService } from './ai-settings.service.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

describe('AiSettingsService platform rag settings', () => {
  const service = new AiSettingsService({ findOne: jest.fn() } as any);

  it('merges default rag settings when absent', () => {
    expect(service.mergeSettings({})).toEqual(
      expect.objectContaining({
        rag: DEFAULT_AI_SETTINGS.rag,
      }),
    );
  });

  it('preserves custom rag documents when provided', () => {
    const merged = service.mergeSettings({
      ai: {
        rag: {
          enabled: true,
          documents: [
            {
              id: 'sop-1',
              title: 'Waitlist SOP',
              content: 'Offer freed slots to waitlist customers.',
              type: 'sop',
              enabled: true,
            },
          ],
        },
      },
    });
    expect(merged.rag?.enabled).toBe(true);
    expect(merged.rag?.documents).toHaveLength(1);
  });
});
