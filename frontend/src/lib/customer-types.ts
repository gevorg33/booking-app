import type { BookingStatus } from './booking-types';

export interface CustomerBookingStats {
  total: number;
  byStatus: Record<string, number>;
  lastBookingAt: string | null;
  upcomingCount: number;
}

export interface CustomerListItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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

export interface CustomerSearchParams {
  search?: string;
  sortBy?: CustomerSortBy;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export function buildCustomerSearchQuery(params: CustomerSearchParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortOrder) q.set('sortOrder', params.sortOrder);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}
