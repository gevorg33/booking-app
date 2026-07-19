import { create } from 'zustand';

/** ai-cmd-provider-5.15.2 — tracks the bookingId of the currently open BookingDetailModal so the global AI assistant can inject it into session context, letting free-typed commands (e.g. "Check in") resolve without naming the client. */
interface ProviderActiveBookingState {
  activeBookingId: string | null;
  setActiveBookingId: (bookingId: string | null) => void;
}

export const useProviderActiveBookingStore = create<ProviderActiveBookingState>((set) => ({
  activeBookingId: null,
  setActiveBookingId: (activeBookingId) => set({ activeBookingId }),
}));
