import type { GuestCheckoutContact } from './guest-booking.util.js';

export const POST_BOOKING_SIGN_IN_PROMPT_SCENARIOS = [
  {
    id: 'guest-with-google',
    input: {
      wasGuestAtBooking: true,
      hasExistingSession: false,
      hasOneTapProvider: true,
      dismissed: false,
    },
    expectPrompt: true,
  },
  {
    id: 'already-signed-in',
    input: {
      wasGuestAtBooking: true,
      hasExistingSession: true,
      hasOneTapProvider: true,
      dismissed: false,
    },
    expectPrompt: false,
  },
  {
    id: 'signed-in-before-booking',
    input: {
      wasGuestAtBooking: false,
      hasExistingSession: true,
      hasOneTapProvider: true,
      dismissed: false,
    },
    expectPrompt: false,
  },
  {
    id: 'no-oauth-configured',
    input: {
      wasGuestAtBooking: true,
      hasExistingSession: false,
      hasOneTapProvider: false,
      dismissed: false,
    },
    expectPrompt: false,
  },
  {
    id: 'guest-dismissed',
    input: {
      wasGuestAtBooking: true,
      hasExistingSession: false,
      hasOneTapProvider: true,
      dismissed: true,
    },
    expectPrompt: false,
  },
] as const;

export const BOOKING_ACTIVATION_ROUTE_SCENARIOS = [
  { id: 'book-service', path: '/s/salon-a/book/svc-1', expectNoAuthWall: true },
  { id: 'book-with-query', path: '/s/salon-a/book/svc-1?slot=2026-06-10T14:00:00.000Z', expectNoAuthWall: true },
  { id: 'account-tab', path: '/s/salon-a/account', expectNoAuthWall: false },
  { id: 'login-page', path: '/s/salon-a/login', expectNoAuthWall: false },
] as const;

export const GUEST_MERGE_HINT_SCENARIOS = [
  {
    id: 'email-only',
    contact: { name: 'Alex', email: 'alex@example.com', phone: '' } satisfies GuestCheckoutContact,
    expectIncludes: 'alex@example.com',
  },
  {
    id: 'phone-only',
    contact: { name: 'Alex', email: '', phone: '+37499123456' } satisfies GuestCheckoutContact,
    expectIncludes: '+37499123456',
  },
  {
    id: 'empty-contact',
    contact: { name: 'Alex', email: '', phone: '' } satisfies GuestCheckoutContact,
    expectIncludes: 'same email or phone',
  },
] as const;
