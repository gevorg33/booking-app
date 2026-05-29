import { z } from 'zod';

export const dateRangeSchema = z.object({
  date: z.string().optional().describe('Single day YYYY-MM-DD'),
  dateFrom: z.string().optional().describe('Range start YYYY-MM-DD'),
  dateTo: z.string().optional().describe('Range end YYYY-MM-DD'),
});

export const employeeSchema = z.object({
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
});

export const employeeIdsSchema = z.object({
  employeeIds: z.array(z.string()).optional(),
  employeeId: z.string().optional(),
});

export const bookingIdsSchema = z.object({
  bookingIds: z.array(z.string()).min(1),
});

export const serviceCreateSchema = z.object({
  name: z.string(),
  durationMinutes: z.number().min(5),
  price: z.number().min(0),
  description: z.string().optional(),
  bufferMinutes: z.number().optional(),
  currency: z.string().optional(),
});

export const directSchedulePeriodSchema = z.object({
  startTime: z.string().describe('HH:MM 24h'),
  endTime: z.string().describe('HH:MM 24h'),
  type: z.enum(['service_block', 'unavailable_block']),
  serviceIds: z.array(z.string()).optional(),
  label: z.string().optional(),
});

export const compoundStepSchema = z.object({
  action: z.string().describe('Workflow action name e.g. cancel_bookings, clear_schedule'),
  description: z.string(),
  params: z.record(z.string(), z.unknown()).default({}),
  chainPrevious: z
    .boolean()
    .optional()
    .describe('If true (default), depends on the previous step in this batch'),
});

export function buildDateParams(input: z.infer<typeof dateRangeSchema>): Record<string, unknown> {
  if (input.dateFrom && input.dateTo) {
    return { dateRange: { start: input.dateFrom, end: input.dateTo } };
  }
  if (input.date) {
    return { date: input.date };
  }
  return {};
}
