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
    expect(schema).not.toMatch(/"action":\s*"[^"]*check_providers_for_service/);
    expect(schema).not.toMatch(/"action":\s*"[^"]*book_nearest_slot/);
    expect(schema).toContain('Availability vs booking (public booking page)');
    expect(schema).toContain('Do NOT use check_providers_for_service');
    expect(schema).toContain('Armenian/Russian/transliteration check+book');
    expect(schema).toContain('забронируй ближайший');
    expect(schema).toContain('explain_checkout_currency');
    expect(schema).toContain('explain_checkout_tax');
    expect(schema).toContain('explain_deposit_forfeiture');
    expect(schema).toContain('find_services_under_budget');
    expect(schema).toContain('Services under $50');
    expect(schema).toContain('find_evening_weekend_slots');
    expect(schema).toContain('Evening or weekend slots for');
    expect(schema).toContain('explain_salon_profile');
    expect(schema).toContain('Tell me about this salon');
    expect(schema).toContain('Do I lose my deposit if I cancel?');
    expect(schema).toContain('NOT explain_consumer_checkout_tax');
    expect(schema).toContain('explain_why_stripe_required');
    expect(schema).toContain('diagnose_stripe_checkout_failure');
    expect(schema).toContain('pay_at_venue_fallback');
    expect(schema).toContain('resume_booking_draft');
    expect(schema).toContain('explain_slot_no_longer_available');
    expect(schema).toContain('explain_voice_input');
    expect(schema).toContain('speak_assistant_reply');
    expect(schema).toContain('give_ai_feedback');
    expect(schema).toContain('explain_rtl_layout');
    expect(schema).toContain('explain_checkout_total');
    expect(schema).toContain('explain_amount_due_now');
    expect(schema).toContain('How much do I pay today?');
    expect(schema).toContain('explain_guest_checkout_fields');
    expect(schema).toContain('explain_why_sign_in');
    expect(schema).toContain('sign_in_to_manage_booking');
    expect(schema).toContain('recover_lost_manage_link');
    expect(schema).toContain('fix_checkout_validation_error');
    expect(schema).toContain('confirm_my_booking_details');
    expect(schema).toContain('leave_visit_review');
    expect(schema).toContain('leave a 5 star review for my facemassage visit');
    expect(schema).toContain('NOT confirm_my_booking_details');
    expect(schema).toContain('add_booking_to_calendar');
    expect(schema).toContain('get_directions_to_salon');
    expect(schema).toContain('explain_preparation_notes');
    expect(schema).toContain('Why do you need my email');
    expect(schema).toContain('explain_service_price');
    expect(schema).toContain('explain_payment_options_for_service');
    expect(schema).toContain('find_soonest_appointment');
    expect(schema).toContain('join_waitlist');
    expect(schema).toContain('check_waitlist_status');
    expect(schema).toContain("Who's free soonest for a trim");
    expect(schema).toContain('compare_services');
    expect(schema).toContain('Haircut vs blowdry price and duration');
    expect(schema).toContain('filter_services_no_prepayment');
    expect(schema).toContain('What can I book without paying online?');
    expect(schema).toContain('explain_business_hours_and_location');
    expect(schema).toContain('Directions to the salon');
    expect(schema).toContain('Do I need to fast before my visit?');
    expect(schema).toContain('When are you open Saturday?');
    expect(schema).toContain('explain_provider_specialty');
    expect(schema).toContain('explain_any_provider_option');
    expect(schema).toContain('pick_provider_for_service');
    expect(schema).toContain('switch_provider_same_time');
    expect(schema).toContain('explain_professional_profile');
    expect(schema).toContain('explain_provider_availability');
    expect(schema).toContain('What does Any stylist mean?');
    expect(schema).toContain('Book with Anna for color');
    expect(schema).toContain('Keep 3pm but different stylist');
    expect(schema).toContain("Show me Anna's services");
    expect(schema).toContain('Is Marco working Saturday?');
    expect(schema).toContain('Who is best for curly hair?');
    expect(schema).toContain('why prepayment');
    expect(schema).toContain('do I pay online for color');
    expect(schema).toContain('session serviceId/serviceName');
    expect(schema).toContain('choose_payment_method');
    expect(schema).toContain('pay_cash_at_visit');
    expect(schema).toContain('pay_online');
    expect(schema).toContain('book_multi_service');
    expect(schema).toContain('check_multi_service_availability');
    expect(schema).toContain('add_services_to_cart');
    expect(schema).toContain('promo_code_help');
    expect(schema).toContain('how_to_download_app');
    expect(schema).toContain('/get-app/[slug]');
    expect(schema).toContain('where enter promo code');
    expect(schema).toContain('proceed to Stripe checkout');
    expect(schema).toContain('Can I pay cash');
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
    expect(schema).toContain('explain_tour_meeting_point');
    expect(schema).toContain('Where do we meet for my tour?');
    expect(schema).toContain('explain_checkout_recommendations');
    expect(schema).toContain('You might also like');
    expect(schema).toContain('NOT explain_recommendation_setup');
    expect(schema).toContain(
      'Why did checkout reject 4 people for the mountain trek',
    );
    expect(schema).toContain('NOT explain_tour_day_slots');
    expect(schema).toContain('list_my_test_results');
    expect(schema).toContain('explain_result_status');
    expect(schema).toContain('list_my_lab_booking_requests');
    expect(schema).toContain('book_lab_collection');
    expect(schema).toContain('booking page');
    expect(schema).toContain('"maxPrice"');
    expect(schema).toContain('I need a haircut, I have $50');
    expect(schema).toContain('NOT discover_packages (bundles/deals catalog');
    expect(schema).toContain('gift card / checkout — NO maxPrice');
    expect(schema).toContain('"serviceRank"');
    expect(schema).toContain('highest_price');
    expect(schema).toContain('lowest_price');
    expect(schema).toContain('most_popular');
    expect(schema).toContain('What is the best and premium haircut service?');
    expect(schema).toContain(
      'recommend_specialists, serviceCategory=massage — NO serviceRank',
    );
    expect(schema).toContain('"availabilityWindows"');
    expect(schema).toContain(
      'I want a haircut tomorrow evening or Friday afternoon',
    );
    expect(schema).toContain('Monday and Friday afternoon');
    expect(schema).toContain('AND vs OR');
    expect(schema).toContain(
      'booking_help: READ — step-aware booking funnel guide',
    );
    expect(schema).toContain(
      'explain_app_feature: READ — public booking page UI semantics',
    );
    expect(schema).toContain(
      'bookingStep in session selects playbook when omitted',
    );
  });
});
