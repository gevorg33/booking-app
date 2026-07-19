import { describe, expect, it } from 'vitest';
import { formatPublicReviewAppointmentRange } from './public-review-appointment.util';

describe('formatPublicReviewAppointmentRange (e2e-bug.59)', () => {
  it('uses distinct end time so the range is not zero-length', () => {
    const label = formatPublicReviewAppointmentRange(
      '2026-07-21T10:35:00.000Z',
      '2026-07-21T11:35:00.000Z',
      'en',
    );
    expect(label).toMatch(/10:35/);
    expect(label).toMatch(/11:35/);
    expect(label).not.toMatch(/10:35–10:35/);
  });

  it('falls back to start when end is missing (legacy context)', () => {
    const label = formatPublicReviewAppointmentRange(
      '2026-07-21T10:35:00.000Z',
      undefined,
      'en',
    );
    expect(label).toMatch(/10:35–10:35/);
  });
});
