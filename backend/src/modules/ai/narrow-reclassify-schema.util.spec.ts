import { buildNarrowClassifierSchema } from './narrow-reclassify-schema.util.js';
import { NARROW_INTENT_SHORTLIST_PIPE_MARKER } from './narrow-intent-shortlist.util.js';
import {
  DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES,
  PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES,
} from './ai-intent-disambiguation.fixtures.js';

describe('narrow-reclassify-schema.util (pipe-1.4.7)', () => {
  it('includes only shortlisted actions in schema', () => {
    const schema = buildNarrowClassifierSchema('dashboard', [
      'create_booking',
      'check_providers_for_service',
    ]);
    expect(schema).toContain(NARROW_INTENT_SHORTLIST_PIPE_MARKER);
    expect(schema).toContain('"create_booking"');
    expect(schema).toContain('"check_providers_for_service"');
    expect(schema).toContain(DASHBOARD_AVAILABILITY_DISAMBIGUATION_RULES);
    expect(schema).not.toContain('"create_direct_schedule"');
  });

  it('uses public disambiguation rules on public surface', () => {
    const schema = buildNarrowClassifierSchema('public', [
      'book_appointment',
      'check_availability',
    ]);
    expect(schema).toContain(PUBLIC_AVAILABILITY_DISAMBIGUATION_RULES);
    expect(schema).toContain('"book_appointment"');
  });

  it('adds schedule disambiguation when schedule ops are shortlisted', () => {
    const schema = buildNarrowClassifierSchema('dashboard', [
      'create_direct_schedule',
      'apply_schedule',
    ]);
    expect(schema).toContain('Schedule ops disambiguation');
    expect(schema).toContain('create_direct_schedule');
  });
});
