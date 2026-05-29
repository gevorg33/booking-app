import { create } from 'zustand';
import { getTodayDateKey, addCalendarDays, todayDateAnchor, toDateKey } from '@/lib/date-format';

export interface TimePeriod {
  startTime: string;
  endTime: string;
  type: 'service_block' | 'unavailable_block' | 'blocked_time';
  placeholderLabel?: string;
  serviceIds?: string[];
  isActiveOnMonday?: boolean;
  isActiveOnTuesday?: boolean;
  isActiveOnWednesday?: boolean;
  isActiveOnThursday?: boolean;
  isActiveOnFriday?: boolean;
  isActiveOnSaturday?: boolean;
  isActiveOnSunday?: boolean;
  maxAppointmentCount?: number;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  businessId: string;
  periods?: TimePeriod[];
  countDaysComplete?: number;
  countDaysIncomplete?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchedulingSlot {
  slotId: string | null;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName?: string;
  serviceId?: string;
  availableCount: number;
  placeholderLabel?: string;
}

export interface Booking {
  id: string;
  businessId: string;
  employeeId: string;
  serviceId: string;
  customerId?: string;
  slotId?: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus?: string;
  notes?: string;
  description?: string;
  cancellationReason?: string;
  linkedEmployeeIds?: string[];
  virtualMeetingUrl?: string;
  metadata?: Record<string, any>;
  employee?: { id: string; name: string };
  service?: { id: string; name: string; durationMinutes: number };
  customer?: { id: string; name: string };
  optimization?: any;
}

interface SchedulingState {
  templates: ScheduleTemplate[];
  totalTemplates: number;
  templatePage: number;
  templatePageSize: number;
  isTemplatesLoading: boolean;

  currentTemplate: ScheduleTemplate | null;
  isTemplateLoading: boolean;

  availableSlots: SchedulingSlot[];
  selectedDate: string;
  isSlotsLoading: boolean;

  bookings: Booking[];
  currentBooking: Booking | null;
  isBookingsLoading: boolean;

  isApplyingTemplate: boolean;
  applyResult: any | null;

  selectedDays: number[];
  dateRange: { start: string; end: string };

  setTemplates: (templates: ScheduleTemplate[], total: number) => void;
  setTemplatesLoading: (loading: boolean) => void;
  setTemplatePage: (page: number) => void;
  setCurrentTemplate: (template: ScheduleTemplate | null) => void;
  setCurrentTemplateLoading: (loading: boolean) => void;
  setAvailableSlots: (slots: SchedulingSlot[]) => void;
  setSelectedDate: (date: string) => void;
  setSlotsLoading: (loading: boolean) => void;
  setBookings: (bookings: Booking[]) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  setBookingsLoading: (loading: boolean) => void;
  setApplyingTemplate: (applying: boolean) => void;
  setApplyResult: (result: any) => void;
  setSelectedDays: (days: number[]) => void;
  setDateRange: (range: { start: string; end: string }) => void;
}

export const useSchedulingStore = create<SchedulingState>()((set) => ({
  templates: [],
  totalTemplates: 0,
  templatePage: 1,
  templatePageSize: 20,
  isTemplatesLoading: false,

  currentTemplate: null,
  isTemplateLoading: false,

  availableSlots: [],
  selectedDate: getTodayDateKey(),
  isSlotsLoading: false,

  bookings: [],
  currentBooking: null,
  isBookingsLoading: false,

  isApplyingTemplate: false,
  applyResult: null,

  selectedDays: [1, 2, 3, 4, 5],
  dateRange: {
    start: getTodayDateKey(),
    end: toDateKey(addCalendarDays(todayDateAnchor(), 30)),
  },

  setTemplates: (templates, total) => set({ templates, totalTemplates: total }),
  setTemplatesLoading: (loading) => set({ isTemplatesLoading: loading }),
  setTemplatePage: (page) => set({ templatePage: page }),
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  setCurrentTemplateLoading: (loading) => set({ isTemplateLoading: loading }),
  setAvailableSlots: (slots) => set({ availableSlots: slots }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSlotsLoading: (loading) => set({ isSlotsLoading: loading }),
  setBookings: (bookings) => set({ bookings }),
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setBookingsLoading: (loading) => set({ isBookingsLoading: loading }),
  setApplyingTemplate: (applying) => set({ isApplyingTemplate: applying }),
  setApplyResult: (result) => set({ applyResult: result }),
  setSelectedDays: (days) => set({ selectedDays: days }),
  setDateRange: (range) => set({ dateRange: range }),
}));
