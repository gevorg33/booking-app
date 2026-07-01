import { buildSalonPath } from './deep-link.js';
import { buildConsumerGuidePath } from './consumer-guide.util.js';
import {
  buildPackageConfirmPath,
  buildPackagePickerPath,
} from './package-booking.js';
import {
  buildProfessionalServicesPath,
  buildProfessionalsPath,
  buildProviderProfilePath,
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

  if (path === 'provider_profile') {
    const employeeId = query.employeeId?.trim();
    if (!employeeId) return null;
    return buildProviderProfilePath(slug, employeeId);
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
    const startTime = query.startTime?.trim() || query.slot?.trim();
    if (startTime) {
      params.set('slot', startTime);
      const date = dateKeyFromStartTime(startTime);
      if (date) params.set('date', date);
    }
    const employeeId = query.employeeId?.trim();
    if (employeeId) params.set('employeeId', employeeId);
    const sessionId = query.session_id?.trim();
    if (sessionId) params.set('session_id', sessionId);
    if (query.rebook?.trim()) params.set('rebook', query.rebook.trim());
    if (query.rebookBookingId?.trim()) {
      params.set('rebookBookingId', query.rebookBookingId.trim());
    }
    if (query.rebookSource?.trim()) {
      params.set('rebookSource', query.rebookSource.trim());
    }
    if (query.freshBook?.trim()) params.set('freshBook', query.freshBook.trim());
    if (query.date?.trim()) params.set('date', query.date.trim());
    if (query.resume?.trim()) params.set('resume', query.resume.trim());
    if (query.resumePayment?.trim()) {
      params.set('resumePayment', query.resumePayment.trim());
    }
    const qs = params.toString();
    return `/s/${slug}/book/${serviceId}${qs ? `?${qs}` : ''}`;
  }

  if (path === 'account') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return buildSalonPath(slug, `/account${qs ? `?${qs}` : ''}`);
  }

  if (path === 'login') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return buildSalonPath(slug, `/login${qs ? `?${qs}` : ''}`);
  }

  if (path === 'manage') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return buildSalonPath(slug, `/manage${qs ? `?${qs}` : ''}`);
  }

  if (path === 'home') {
    return buildSalonPath(slug);
  }

  if (path === 'salon') {
    const targetSlug = query.slug?.trim();
    if (!targetSlug) return null;
    return buildSalonPath(targetSlug);
  }

  if (path === 'tenant_switch') {
    return buildSalonPath(slug);
  }

  if (path === 'profile') {
    return buildSalonPath(slug, '/profile');
  }

  if (path === 'multi/checkout') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    return `/s/${slug}/book/multi/checkout${qs ? `?${qs}` : ''}`;
  }

  if (path === 'guide') {
    return buildConsumerGuidePath(slug, query);
  }

  if (path === 'gift-cards' || path === 'gift-cards/checkout') {
    const params = new URLSearchParams(query);
    const qs = params.toString();
    const subpath = path === 'gift-cards/checkout' ? '/gift-cards/checkout' : '/gift-cards';
    return buildSalonPath(slug, `${subpath}${qs ? `?${qs}` : ''}`);
  }

  return null;
}

export function parseMultiServiceIdsParam(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return [...new Set(value.split(',').map((id) => id.trim()).filter(Boolean))];
}
