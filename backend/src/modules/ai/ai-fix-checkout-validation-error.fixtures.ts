import type { CheckoutValidationErrorAspect } from './ai-fix-checkout-validation-error.util.js';

export type FixCheckoutValidationErrorPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'fix_checkout_validation_error';
  aspect: CheckoutValidationErrorAspect;
  rescueReason: 'checkout_validation_error';
};

export const FIX_CHECKOUT_VALIDATION_ERROR_PROMPTS: readonly FixCheckoutValidationErrorPromptFixture[] =
  [
    {
      id: 'email-filled-customer',
      prompt: 'It says enter email but I already filled it in at checkout',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'wont-accept-email-customer',
      prompt: "Checkout won't accept my email even though it's there",
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'invalid-email-customer',
      prompt: 'I keep getting invalid email on the booking form',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'phone-error-customer',
      prompt: 'Why does checkout say enter phone when I typed my number?',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'phone',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'name-required-customer',
      prompt: 'It keeps saying enter your name but the name field looks filled',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'name',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'email-or-phone-customer',
      prompt:
        'Error says enter an email or phone number but both fields have text',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'contact_or',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'profile-merge-customer',
      prompt: 'I am signed in but checkout still says enter contact details',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'profile_merge',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'profile-prefill-customer',
      prompt: 'My profile email shows but booking says contact details missing',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'profile_merge',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'consent-blocked-customer',
      prompt:
        'Checkout validation error about privacy consent — I cannot confirm',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'consent',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'collapsed-fields-customer',
      prompt:
        'Contact details are collapsed but book button says enter contact details',
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'compact_hidden',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'cant-finish-customer',
      prompt: "Checkout won't let me finish — keeps showing a validation error",
      surface: 'customer',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'all',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'email-filled-public',
      prompt: 'It says enter email but I filled it in on checkout',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'wont-accept-email-public',
      prompt: "The booking page won't accept my email address",
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'invalid-email-public',
      prompt: 'Invalid email error when I try to confirm my booking',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'email',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'phone-error-public',
      prompt: 'Checkout error says enter phone even though I added one',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'phone',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'name-required-public',
      prompt: 'Form validation keeps asking for my name at checkout',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'name',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'email-or-phone-public',
      prompt: 'It says enter an email or phone number but I filled both in',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'contact_or',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'profile-merge-public',
      prompt: 'Signed in on public booking but still get enter contact details',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'profile_merge',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'consent-blocked-public',
      prompt: 'Privacy checkbox validation error blocks checkout confirm',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'consent',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'collapsed-fields-public',
      prompt:
        'Personal information section is collapsed and booking fails validation',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'compact_hidden',
      rescueReason: 'checkout_validation_error',
    },
    {
      id: 'cant-finish-public',
      prompt: 'Cannot complete checkout — validation error on contact fields',
      surface: 'public',
      expectedAction: 'fix_checkout_validation_error',
      aspect: 'all',
      rescueReason: 'checkout_validation_error',
    },
  ] as const;

export const FIX_CHECKOUT_VALIDATION_ERROR_RESCUE_SCENARIOS = [
  {
    id: 'guest-fields-to-validation-fix',
    prompt: 'It says enter email but I already filled it in at checkout',
    misclassifiedAction: 'explain_guest_checkout_fields',
    expectedAction: 'fix_checkout_validation_error',
  },
  {
    id: 'booking-help-to-validation-fix',
    prompt: 'Checkout validation error says enter your name',
    misclassifiedAction: 'booking_help',
    expectedAction: 'fix_checkout_validation_error',
  },
  {
    id: 'unknown-to-validation-fix',
    prompt:
      'Error says enter an email or phone number but both fields have text',
    misclassifiedAction: 'unknown',
    expectedAction: 'fix_checkout_validation_error',
  },
] as const;
