import type { BookingStatus } from './booking-types';

export interface CustomerBookingStats {
  total: number;
  byStatus: Record<string, number>;
  lastBookingAt: string | null;
  upcomingCount: number;
  noShowCount: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags?: string[];
  isVip?: boolean;
  segment?: string;
  createdAt: string;
  updatedAt: string;
  stats: CustomerBookingStats;
}

export interface CustomersDashboardStats {
  totalCustomers: number;
  filteredCustomers: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
}

export interface CustomersSearchResult {
  stats: CustomersDashboardStats;
  customers: CustomerListItem[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export type CustomerSortBy = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'ASC' | 'DESC';

export const CUSTOMER_TAGS = ['vip', 'regular', 'persona', 'corporate', 'referral'] as const;
export type CustomerTag = (typeof CUSTOMER_TAGS)[number];

export type CustomerSegment = 'vip' | 'at_risk' | 'high_no_show' | 'new' | 'regular';

export function customerTagLabelKey(tag: CustomerTag): `customers.tag.${CustomerTag}` {
  return `customers.tag.${tag}`;
}

export function primaryCustomerTag(tags?: string[]): CustomerTag | '' {
  const match = (tags ?? []).find((tag): tag is CustomerTag =>
    (CUSTOMER_TAGS as readonly string[]).includes(tag as CustomerTag),
  );
  return match ?? '';
}

/** Match table VIP display: stored tag, isVip flag, or computed vip segment. */
export function resolveCustomerTagForEdit(input: {
  tags?: string[];
  isVip?: boolean;
  segment?: string;
}): CustomerTag | '' {
  const fromTags = primaryCustomerTag(input.tags);
  if (fromTags) return fromTags;
  if (input.isVip || input.segment === 'vip') return 'vip';
  return '';
}

export function isAutoVipFromSegment(input: {
  tags?: string[];
  isVip?: boolean;
  segment?: string;
}): boolean {
  return (
    input.segment === 'vip' &&
    !primaryCustomerTag(input.tags) &&
    !input.isVip
  );
}

export interface CustomerSearchParams {
  search?: string;
  tags?: CustomerTag;
  segment?: CustomerSegment;
  isVip?: boolean;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export function buildCustomerSearchQuery(params: CustomerSearchParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.tags) q.set('tags', params.tags);
  if (params.segment) q.set('segment', params.segment);
  if (params.isVip === true) q.set('isVip', 'true');
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortOrder) q.set('sortOrder', params.sortOrder);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}
