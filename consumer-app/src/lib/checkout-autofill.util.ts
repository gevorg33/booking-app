import type { PublicCustomerProfile } from './types.js';
import type { GuestCheckoutContact } from './guest-booking.util.js';
import { normalizeGuestContact } from './guest-booking.util.js';

const rememberKey = (slug: string) => `consumer_checkout_contact_${slug}`;

export function guestContactFieldAttrs(field: 'name' | 'email' | 'phone') {
  return { name: `guest_${field}`, id: `guest_${field}` };
}

export function loadRememberedCheckoutContact(slug: string): GuestCheckoutContact | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(rememberKey(slug));
  if (!raw) return null;
  try {
    return normalizeGuestContact(JSON.parse(raw) as Partial<GuestCheckoutContact>);
  } catch {
    return null;
  }
}

export function saveRememberedCheckoutContact(
  slug: string,
  contact: GuestCheckoutContact,
): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(rememberKey(slug), JSON.stringify(normalizeGuestContact(contact)));
}

export function resolveCheckoutContactPrefill(input: {
  profile: PublicCustomerProfile | null;
  draft: GuestCheckoutContact | null;
  remembered: GuestCheckoutContact | null;
}): GuestCheckoutContact {
  if (input.profile?.name?.trim()) {
    return normalizeGuestContact({
      name: input.profile.name,
      email: input.profile.email ?? '',
      phone: input.profile.phone ?? '',
    });
  }
  if (input.draft?.name?.trim()) return normalizeGuestContact(input.draft);
  if (input.remembered?.name?.trim()) return normalizeGuestContact(input.remembered);
  return normalizeGuestContact({});
}
