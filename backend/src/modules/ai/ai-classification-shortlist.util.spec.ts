import { buildPublicClassifierSchema } from '../public-booking/public-booking-assistant.service.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import {
  buildIntentShortlist,
  formatDynamicActionEnum,
  formatIntentShortlistBlock,
  getSurfaceIntentCount,
  isActionAllowedByShortlist,
  readClassificationShortlistFromContext,
  reconcileClassifiedActionWithShortlist,
  scoreIntentForShortlist,
} from './ai-classification-shortlist.util.js';

describe('ai-classification-shortlist.util (acc-3.3)', () => {
  it('getSurfaceIntentCount reflects registry size per surface', () => {
    expect(getSurfaceIntentCount('dashboard')).toBeGreaterThan(200);
    expect(getSurfaceIntentCount('provider')).toBeGreaterThan(50);
    expect(getSurfaceIntentCount('customer')).toBeGreaterThan(70);
    expect(getSurfaceIntentCount('public')).toBeGreaterThan(40);
  });

  it('buildIntentShortlist keeps size between 10 and 15 and always includes unknown', () => {
    const shortlist = buildIntentShortlist({
      prompt: 'Book massage with Gevorg tomorrow at 10:00',
      surface: 'dashboard',
    });
    expect(shortlist[0]).toBe('unknown');
    expect(shortlist).toContain('create_booking');
    expect(shortlist.length).toBeGreaterThanOrEqual(10);
    expect(shortlist.length).toBeLessThanOrEqual(15);
  });

  it('buildIntentShortlist boosts cancel intents for cancellation prompts', () => {
    const shortlist = buildIntentShortlist({
      prompt: 'Cancel Maria appointment tomorrow',
      surface: 'dashboard',
    });
    expect(shortlist).toContain('cancel_bookings');
  });

  it('buildIntentShortlist boosts revenue intents for earnings prompts', () => {
    const shortlist = buildIntentShortlist({
      prompt: 'How much revenue did we make this week?',
      surface: 'dashboard',
    });
    expect(
      shortlist.some((intent) =>
        ['summarize_revenue', 'summarize_bookings', 'explain_revenue'].includes(
          intent,
        ),
      ),
    ).toBe(true);
  });

  it('scoreIntentForShortlist ranks booking intents above unrelated ones', () => {
    const prompt = 'Book Swedish massage tomorrow at 14:00';
    const bookingScore = scoreIntentForShortlist(prompt, 'create_booking', 'dashboard');
    const unrelatedScore = scoreIntentForShortlist(
      prompt,
      'configure_stripe_tax',
      'dashboard',
    );
    expect(bookingScore).toBeGreaterThan(unrelatedScore);
  });

  it('formatIntentShortlistBlock includes allowed-actions constraint', () => {
    const block = formatIntentShortlistBlock(['unknown', 'create_booking']);
    expect(block).toContain('Plausible intents');
    expect(block).toContain('Allowed actions for this turn');
    expect(block).toContain('create_booking');
  });

  it('formatDynamicActionEnum omits unknown from primary list but keeps unknown fallback', () => {
    expect(formatDynamicActionEnum(['unknown', 'create_booking', 'list_bookings'])).toBe(
      'create_booking | list_bookings | unknown',
    );
  });

  it('isActionAllowedByShortlist permits unknown and listed actions only', () => {
    const shortlist = ['unknown', 'create_booking'];
    expect(isActionAllowedByShortlist('unknown', shortlist)).toBe(true);
    expect(isActionAllowedByShortlist('create_booking', shortlist)).toBe(true);
    expect(isActionAllowedByShortlist('list_bookings', shortlist)).toBe(false);
  });

  it('reconcileClassifiedActionWithShortlist rescues out-of-shortlist actions', () => {
    const shortlist = buildIntentShortlist({
      prompt: 'Book massage tomorrow at 10:00',
      surface: 'dashboard',
    });
    const reconciled = reconcileClassifiedActionWithShortlist(
      'configure_stripe_tax',
      'Book massage tomorrow at 10:00',
      'dashboard',
      shortlist,
    );
    expect(reconciled.adjusted).toBe(true);
    expect(shortlist).toContain(reconciled.action);
  });

  it('readClassificationShortlistFromContext reads gateway meta', () => {
    expect(
      readClassificationShortlistFromContext({
        _classificationEngineMeta: {
          shortlist: ['unknown', 'book_appointment'],
        },
      }),
    ).toEqual(['unknown', 'book_appointment']);
    expect(readClassificationShortlistFromContext({})).toBeUndefined();
  });

  it('buildCustomerClassifierSchema narrows action enum when shortlist provided', () => {
    const schema = buildCustomerClassifierSchema([
      'unknown',
      'book_nearest_slot',
      'check_providers_for_service',
    ]);
    expect(schema).toMatch(
      /"action":\s*book_nearest_slot \| check_providers_for_service \| unknown/,
    );
    expect(schema).not.toMatch(
      /"action":\s*[^"]*cancel_my_booking/,
    );
  });

  it('buildPublicClassifierSchema narrows action enum when shortlist provided', () => {
    const schema = buildPublicClassifierSchema([
      'unknown',
      'check_availability',
      'book_appointment',
    ]);
    expect(schema).toMatch(
      /"action":\s*check_availability \| book_appointment \| unknown/,
    );
    expect(schema).not.toMatch(
      /"action":\s*[^"]*explain_tour_booking/,
    );
  });
});
