import type { CatalogCategoryDraft } from './business-types.constants.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';

export type VerticalPlaybookId = 'salon' | 'clinic';

export interface VerticalScheduleTemplateDraft {
  name: string;
  applyDays: number[];
  repeatWeeksCount: number;
  timePeriods: Array<{
    startTime: string;
    endTime: string;
    type: TemplatePeriodType;
    isActiveOnMonday: boolean;
    isActiveOnTuesday: boolean;
    isActiveOnWednesday: boolean;
    isActiveOnThursday: boolean;
    isActiveOnFriday: boolean;
    isActiveOnSaturday: boolean;
    isActiveOnSunday: boolean;
    maxAppointmentCount?: number;
    placeholderLabel?: string;
  }>;
}

export interface VerticalPlaybook {
  id: VerticalPlaybookId;
  labelKey: string;
  descriptionKey: string;
  categories: CatalogCategoryDraft[];
  scheduleTemplates: VerticalScheduleTemplateDraft[];
}

const SALON_PLAYBOOK: VerticalPlaybook = {
  id: 'salon',
  labelKey: 'onboarding.playbooks.salon',
  descriptionKey: 'onboarding.playbooks.salonDesc',
  categories: [
    {
      name: 'Haircuts & styling',
      sortOrder: 0,
      services: [
        {
          name: "Women's haircut",
          durationMinutes: 60,
          price: 65,
          bufferMinutes: 10,
        },
        {
          name: "Men's haircut",
          durationMinutes: 30,
          price: 35,
          bufferMinutes: 5,
        },
        { name: 'Blowout & styling', durationMinutes: 45, price: 45 },
      ],
    },
    {
      name: 'Color & treatments',
      sortOrder: 1,
      services: [
        {
          name: 'Hair coloring',
          durationMinutes: 120,
          price: 120,
          bufferMinutes: 15,
        },
        {
          name: 'Highlights / balayage',
          durationMinutes: 150,
          price: 180,
          bufferMinutes: 15,
        },
      ],
    },
    {
      name: 'Nails & beauty',
      sortOrder: 2,
      services: [
        { name: 'Classic manicure', durationMinutes: 45, price: 35 },
        { name: 'Gel manicure', durationMinutes: 60, price: 50 },
      ],
    },
  ],
  scheduleTemplates: [
    {
      name: 'Salon weekday hours',
      applyDays: [1, 2, 3, 4, 5],
      repeatWeeksCount: 4,
      timePeriods: [
        {
          startTime: '09:00',
          endTime: '19:00',
          type: TemplatePeriodType.SERVICE_BLOCK,
          isActiveOnMonday: true,
          isActiveOnTuesday: true,
          isActiveOnWednesday: true,
          isActiveOnThursday: true,
          isActiveOnFriday: true,
          isActiveOnSaturday: false,
          isActiveOnSunday: false,
          maxAppointmentCount: 1,
        },
      ],
    },
    {
      name: 'Saturday salon hours',
      applyDays: [6],
      repeatWeeksCount: 4,
      timePeriods: [
        {
          startTime: '10:00',
          endTime: '17:00',
          type: TemplatePeriodType.SERVICE_BLOCK,
          isActiveOnMonday: false,
          isActiveOnTuesday: false,
          isActiveOnWednesday: false,
          isActiveOnThursday: false,
          isActiveOnFriday: false,
          isActiveOnSaturday: true,
          isActiveOnSunday: false,
          maxAppointmentCount: 1,
        },
      ],
    },
  ],
};

const CLINIC_PLAYBOOK: VerticalPlaybook = {
  id: 'clinic',
  labelKey: 'onboarding.playbooks.clinic',
  descriptionKey: 'onboarding.playbooks.clinicDesc',
  categories: [
    {
      name: 'Consultations',
      sortOrder: 0,
      services: [
        {
          name: 'Initial consultation',
          durationMinutes: 30,
          price: 0,
          bufferMinutes: 10,
        },
        {
          name: 'Follow-up consultation',
          durationMinutes: 20,
          price: 0,
          bufferMinutes: 5,
        },
      ],
    },
    {
      name: 'Aesthetic treatments',
      sortOrder: 1,
      services: [
        {
          name: 'Botox treatment',
          durationMinutes: 30,
          price: 250,
          bufferMinutes: 10,
        },
        {
          name: 'Dermal filler',
          durationMinutes: 45,
          price: 350,
          bufferMinutes: 15,
        },
        {
          name: 'Laser hair removal (small area)',
          durationMinutes: 30,
          price: 80,
        },
      ],
    },
    {
      name: 'Dental care',
      sortOrder: 2,
      services: [
        { name: 'Dental check-up', durationMinutes: 30, price: 60 },
        {
          name: 'Teeth cleaning',
          durationMinutes: 45,
          price: 90,
          bufferMinutes: 10,
        },
      ],
    },
  ],
  scheduleTemplates: [
    {
      name: 'Clinic weekday hours',
      applyDays: [1, 2, 3, 4, 5],
      repeatWeeksCount: 4,
      timePeriods: [
        {
          startTime: '08:00',
          endTime: '12:00',
          type: TemplatePeriodType.SERVICE_BLOCK,
          isActiveOnMonday: true,
          isActiveOnTuesday: true,
          isActiveOnWednesday: true,
          isActiveOnThursday: true,
          isActiveOnFriday: true,
          isActiveOnSaturday: false,
          isActiveOnSunday: false,
          maxAppointmentCount: 1,
        },
        {
          startTime: '13:00',
          endTime: '18:00',
          type: TemplatePeriodType.SERVICE_BLOCK,
          isActiveOnMonday: true,
          isActiveOnTuesday: true,
          isActiveOnWednesday: true,
          isActiveOnThursday: true,
          isActiveOnFriday: true,
          isActiveOnSaturday: false,
          isActiveOnSunday: false,
          maxAppointmentCount: 1,
        },
        {
          startTime: '12:00',
          endTime: '13:00',
          type: TemplatePeriodType.UNAVAILABLE_BLOCK,
          isActiveOnMonday: true,
          isActiveOnTuesday: true,
          isActiveOnWednesday: true,
          isActiveOnThursday: true,
          isActiveOnFriday: true,
          isActiveOnSaturday: false,
          isActiveOnSunday: false,
          placeholderLabel: 'Lunch break',
        },
      ],
    },
  ],
};

export const VERTICAL_PLAYBOOKS: Record<VerticalPlaybookId, VerticalPlaybook> =
  {
    salon: SALON_PLAYBOOK,
    clinic: CLINIC_PLAYBOOK,
  };

/** Maps onboarding business types to salon vs clinic playbook bundles. */
export const BUSINESS_TYPE_TO_PLAYBOOK: Record<string, VerticalPlaybookId> = {
  hair_salon: 'salon',
  barbershop: 'salon',
  nail_salon: 'salon',
  spa: 'salon',
  massage: 'salon',
  beauty_clinic: 'clinic',
  dental: 'clinic',
  other: 'salon',
};

export function resolveVerticalPlaybookId(
  businessType: string,
): VerticalPlaybookId {
  return BUSINESS_TYPE_TO_PLAYBOOK[businessType] ?? 'salon';
}

export function getVerticalPlaybook(businessType: string): VerticalPlaybook {
  const id = resolveVerticalPlaybookId(businessType);
  return VERTICAL_PLAYBOOKS[id];
}
