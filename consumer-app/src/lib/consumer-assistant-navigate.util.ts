import { buildSalonPath } from './deep-link.js';
import {
  buildPackageConfirmPath,
  buildPackagePickerPath,
} from './package-booking.js';
import {
  buildProfessionalServicesPath,
  buildProfessionalsPath,
} from './provider-booking.util.js';
import type { PublicAssistantNavigate } from './public-assistant-checkout.util.js';

export function dateKeyFromStartTime(startTime: string): string {
  const parsed = Date.parse(startTime);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 10);
}

export function buildConsumerAssistantHref(
  slug: string,
  navigate: PublicAssistantNavigate,
): string | null {
  const { path, query } = navigate;

  if (path === 'professionals') {
    const employeeId = query.employeeId?.trim();
    const startTime = query.startTime?.trim();
    if (employeeId && startTime) {
      return buildProfessionalServicesPath(slug, employeeId, startTime, {
        employeeName: query.employeeName?.trim(),
      });
    }
    return buildProfessionalsPath(slug, {
      employeeId: query.employeeId,
      startTime: query.startTime,
    });
  }

  if (path === 'services') {
    const employeeId = query.employeeId?.trim();
    const startTime = query.startTime?.trim();
    if (employeeId && startTime) {
      return buildProfessionalServicesPath(slug, employeeId, startTime, {
        employeeName: query.employeeName?.trim(),
      });
    }
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return `/s/${slug}/services${qs ? `?${qs}` : ''}`;
  }

  if (path === 'packages') {
    const packageId = query.packageId?.trim();
    if (packageId) return buildPackageConfirmPath(slug, packageId);
    return buildPackagePickerPath(slug);
  }

  if (path === 'checkout') {
    const packageId = query.packageId?.trim();
    const serviceId = query.serviceId?.trim();
    const services = query.services?.trim();

    if (packageId && !serviceId && !services) {
      if (query.lines?.trim()) {
        const params = new URLSearchParams(query);
        return buildSalonPath(
          slug,
          `/book/packages/${packageId}/checkout?${params.toString()}`,
        );
      }
      return buildPackageConfirmPath(slug, packageId);
    }

    if (services && !serviceId) {
      const params = new URLSearchParams(query);
      return `/s/${slug}/book/multi/checkout?${params.toString()}`;
    }

    if (!serviceId) return null;
    const params = new URLSearchParams();
    const startTime = query.startTime?.trim();
    if (startTime) {
      params.set('slot', startTime);
      const date = dateKeyFromStartTime(startTime);
      if (date) params.set('date', date);
    }
    const employeeId = query.employeeId?.trim();
    if (employeeId) params.set('employeeId', employeeId);
    if (query.rebook?.trim()) params.set('rebook', query.rebook.trim());
    if (query.rebookBookingId?.trim()) {
      params.set('rebookBookingId', query.rebookBookingId.trim());
    }
    const qs = params.toString();
    return `/s/${slug}/book/${serviceId}${qs ? `?${qs}` : ''}`;
  }

  if (path === 'account') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return buildSalonPath(slug, `/account${qs ? `?${qs}` : ''}`);
  }

  if (path === 'home') {
    return buildSalonPath(slug, '/home');
  }

  if (path === 'multi/checkout') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return `/s/${slug}/book/multi/checkout${qs ? `?${qs}` : ''}`;
  }

  return null;
}

export function parseMultiServiceIdsParam(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))];
}
