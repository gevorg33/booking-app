import { describe, expect, it } from 'vitest';
import {
  normalizeStaffMessageTemplatesSettings,
  readStaffMessageTemplatesSettings,
} from './staff-message-templates.util';

describe('staff-message-templates.util (dashboard prov-exp-6.2)', () => {
  it('reads and normalizes settings from business blob', () => {
    const settings = readStaffMessageTemplatesSettings({
      staffMessageTemplates: {
        enabled: true,
        templates: [
          {
            id: 'late',
            label: ' Running late ',
            body: ' Sorry ',
            enabled: true,
          },
        ],
      },
    });
    expect(settings.enabled).toBe(true);
    expect(normalizeStaffMessageTemplatesSettings(settings).templates[0]).toEqual({
      id: 'late',
      label: 'Running late',
      body: 'Sorry',
      enabled: true,
    });
  });
});
