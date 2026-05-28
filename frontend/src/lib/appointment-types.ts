import type { BookingStatus, PaymentStatus } from './booking-types';

export type AppointmentSortBy =
  | 'startTime'
  | 'customerName'
  | 'serviceName'
  | 'employeeName'
  | 'status'
  | 'createdAt'
  | 'updatedAt';

export type SortOrder = 'ASC' | 'DESC';

export interface AppointmentListItem {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  employee: { id: string; name: string } | null;
  service: { id: string; name: string } | null;
}

export interface AppointmentsSearchResult {
  totalItems: number;
  page: number;
  pageSize: number;
  appointments: AppointmentListItem[];
}

export interface AppointmentSearchParams {
  search?: string;
  status?: BookingStatus | '';
  date?: string;
  sortBy?: AppointmentSortBy;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
}

export function buildAppointmentSearchQuery(params: AppointmentSearchParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.status) q.set('status', params.status);
  if (params.date) q.set('date', params.date);
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortOrder) q.set('sortOrder', params.sortOrder);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const BOOKING_STATUS_FILTER_OPTIONS: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];
