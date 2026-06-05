import { buildPublicClassifierSchema } from './public-booking-assistant.service.js';

describe('buildPublicClassifierSchema', () => {
  it('includes check-and-book rules and public booking params', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('check_availability');
    expect(schema).toContain('book_appointment');
    expect(schema).toContain('bookingFirstAvailable');
    expect(schema).toContain('timeOfDay');
    expect(schema).toContain('who\'s free tomorrow evening for permanent lashes');
    expect(schema).toContain('multi-step flows automatically');
    expect(schema).not.toContain('check_providers_for_service');
    expect(schema).not.toContain('book_nearest_slot');
  });
});
