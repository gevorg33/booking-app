import type { PublicCustomerProfile } from './types.js';

export interface GuestCheckoutContact {
  name: string;
  email: string;
  phone: string;
}

export function normalizeGuestContact(
  input: Partial<GuestCheckoutContact>,
): GuestCheckoutContact {
  return {
    name: (input.name ?? '').trim(),
    email: (input.email ?? '').trim(),
    phone: (input.phone ?? '').trim(),
  };
}

export function validateGuestCheckoutContact(contact: GuestCheckoutContact): string | null {
  if (!contact.name.trim()) return 'Enter your name.';
  if (!contact.email.trim() && !contact.phone.trim()) {
    return 'Enter an email or phone number.';
  }
  return null;
}

export function resolveCheckoutContact(
  profile: PublicCustomerProfile | null | undefined,
  guest: GuestCheckoutContact,
): GuestCheckoutContact | null {
  if (profile?.name?.trim()) {
    return normalizeGuestContact({
      name: profile.name,
      email: profile.email ?? '',
      phone: profile.phone ?? '',
    });
  }
  const normalized = normalizeGuestContact(guest);
  if (validateGuestCheckoutContact(normalized) !== null) return null;
  return normalized;
}
