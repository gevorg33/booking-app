export interface BookingsSettings {
  calendarPayAtVenueFilterDefault: boolean;
}

export const DEFAULT_BOOKINGS_SETTINGS: BookingsSettings = {
  calendarPayAtVenueFilterDefault: false,
};

export function resolveBookingsSettings(
  settings: Record<string, unknown> | undefined,
): BookingsSettings {
  const bookings = (settings?.bookings as Record<string, unknown> | undefined) ?? {};
  return {
    calendarPayAtVenueFilterDefault: bookings.calendarPayAtVenueFilterDefault === true,
  };
}
