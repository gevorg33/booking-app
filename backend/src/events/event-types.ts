export enum EventType {
  // Booking events
  BOOKING_CREATED = 'booking.created',
  /** Alias emitted after booking.created for downstream availability/calendar handlers (clinic-app pattern). */
  APPOINTMENT_CREATED = 'appointment.created',
  BOOKING_CONFIRMED = 'booking.confirmed',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_COMPLETED = 'booking.completed',
  BOOKING_RESCHEDULED = 'booking.rescheduled',
  BOOKING_NO_SHOW = 'booking.no_show',

  // Payment events
  PAYMENT_RECEIVED = 'payment.received',

  // Schedule events
  SCHEDULE_UPDATED = 'schedule.updated',
  SCHEDULE_OVERRIDE_CREATED = 'schedule.override.created',
  SCHEDULE_TEMPLATE_APPLIED = 'schedule.template.applied',
  SCHEDULE_TEMPLATE_CREATED = 'schedule.template.created',
  SCHEDULE_TEMPLATE_DELETED = 'schedule.template.deleted',
  SCHEDULE_SLOTS_GENERATED = 'schedule.slots.generated',
  AVAILABILITY_UPDATED = 'availability.updated',

  // Employee events
  EMPLOYEE_CREATED = 'employee.created',
  EMPLOYEE_UPDATED = 'employee.updated',
  EMPLOYEE_UNAVAILABLE = 'employee.unavailable',

  // Business events
  BUSINESS_CREATED = 'business.created',
  BUSINESS_UPDATED = 'business.updated',

  // Service events
  SERVICE_CREATED = 'service.created',
  SERVICE_UPDATED = 'service.updated',

  // Workflow events
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_STEP_COMPLETED = 'workflow.step.completed',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',

  // Agent events
  AGENT_PLAN_GENERATED = 'agent.plan.generated',
  AGENT_PLAN_VALIDATED = 'agent.plan.validated',
  AGENT_PLAN_REJECTED = 'agent.plan.rejected',
  AGENT_PLAN_EXECUTING = 'agent.plan.executing',
}

export interface DomainEvent {
  id?: string;
  eventType: EventType;
  aggregateType: string;
  aggregateId: string;
  businessId?: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  causationId?: string;
  correlationId?: string;
  userId?: string;
  timestamp?: Date;
}
