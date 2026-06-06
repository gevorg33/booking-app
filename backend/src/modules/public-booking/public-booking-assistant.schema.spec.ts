import { buildPublicClassifierSchema } from './public-booking-assistant.service.js';

describe('buildPublicClassifierSchema', () => {
  it('includes check-and-book rules and public booking params', () => {
    const schema = buildPublicClassifierSchema();
    expect(schema).toContain('check_availability');
    expect(schema).toContain('book_appointment');
    expect(schema).toContain('bookingFirstAvailable');
    expect(schema).toContain('timeOfDay');
    expect(schema).toContain(
      "who's free tomorrow evening for permanent lashes",
    );
    expect(schema).toContain('multi-step flows automatically');
    expect(schema).not.toMatch(
      /"action":\s*"[^"]*check_providers_for_service/,
    );
    expect(schema).not.toMatch(/"action":\s*"[^"]*book_nearest_slot/);
    expect(schema).toContain('Availability vs booking (public booking page)');
    expect(schema).toContain('Do NOT use check_providers_for_service');
    expect(schema).toContain('Armenian/Russian/transliteration check+book');
    expect(schema).toContain('забронируй ближайший');
    expect(schema).toContain('explain_checkout_currency');
    expect(schema).toContain('explain_stripe_checkout_currency');
    expect(schema).toContain('Why do prices show euros on the booking page?');
    expect(schema).toContain('Why was I charged in euros on Stripe checkout?');
    expect(schema).toContain('NOT explain_checkout_total');
    expect(schema).toContain('explain_package_currency');
    expect(schema).toContain('Why is the spa package total in dollars?');
    expect(schema).toContain('explain_booking_languages');
    expect(schema).toContain('explain_booking_date_format');
    expect(schema).toContain(
      'Why can I only see English and Armenian on the booking page?',
    );
    expect(schema).toContain(
      'Why do dates show as DD/MM instead of MM/DD on the booking page?',
    );
    expect(schema).toContain('NOT explain_business_languages');
    expect(schema).toContain('NOT explain_business_date_format');
    expect(schema).toContain('NOT explain_checkout_currency');
    expect(schema).toContain('explain_package_display_name');
    expect(schema).toContain(
      'What is the Armenian name for the Spa Day package on this page?',
    );
    expect(schema).toContain('NOT explain_booking_languages');
    expect(schema).toContain('explain_tour_booking');
    expect(schema).toContain(
      'What is the max group size for City Tour on this booking page?',
    );
    expect(schema).toContain('NOT explain_tour_services');
    expect(schema).toContain('explain_tour_day_slots');
    expect(schema).toContain(
      'Why does the 3-Day Mountain Trek only show one departure per day?',
    );
    expect(schema).toContain('NOT explain_tour_booking');
    expect(schema).toContain('diagnose_tour_capacity');
    expect(schema).toContain('explain_checkout_recommendations');
    expect(schema).toContain('You might also like');
    expect(schema).toContain('NOT explain_recommendation_setup');
    expect(schema).toContain(
      'Why did checkout reject 4 people for the mountain trek',
    );
    expect(schema).toContain('NOT explain_tour_day_slots');
  });
});
