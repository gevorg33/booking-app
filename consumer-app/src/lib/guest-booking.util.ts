import type { PublicCustomerProfile } from './types.js';

export interface GuestCheckoutContact {
  name: string;
  email: string;
  phone: string;
}

export function normalizeGuestContact(contact: Partial<GuestCheckoutContact>): GuestCheckoutContact {
  return {
    name: contact.name?.trim() ?? '',
    email: contact.email?.trim().toLowerCase() ?? '',
    phone: contact.phone?.trim() ?? '',
  };
}

export function resolveCheckoutContact(
  storedProfile: PublicCustomerProfile | null,
  guestContact: Partial<GuestCheckoutContact>,
): GuestCheckoutContact | null {
  if (storedProfile?.name?.trim()) {
    return normalizeGuestContact({
      name: storedProfile.name,
      email: storedProfile.email ?? '',
      phone: storedProfile.phone ?? '',
    });
  }
  const normalized = normalizeGuestContact(guestContact);
  if (!normalized.name) return null;
  if (!normalized.email && !normalized.phone) return null;
  return normalized;
}

export function validateGuestCheckoutContact(contact: GuestCheckoutContact): string | null {
  if (!contact.name.trim()) return 'Enter your name to book.';
  if (!contact.email && !contact.phone) return 'Enter an email or phone number so we can confirm your booking.';
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function guestContactAutocomplete(field: 'name' | 'email' | 'phone'): string {
  switch (field) {
    case 'name':
      return 'name';
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    default:
      return 'off';
  }
}
