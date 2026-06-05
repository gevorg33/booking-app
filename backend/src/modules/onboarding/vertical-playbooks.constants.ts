import type { CatalogCategoryDraft } from './business-types.constants.js';
import { TemplatePeriodType } from '../schedule/entities/scheduling-template-period.entity.js';

export type VerticalPlaybookId = 'salon' | 'clinic' | 'tour';

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
      name: 'General Practice',
      sortOrder: 0,
      services: [
        {
          name: 'Initial consultation',
          description: 'First visit with a general practitioner',
          durationMinutes: 30,
          price: 0,
          bufferMinutes: 10,
          serviceType: 'consultation',
        },
        {
          name: 'Follow-up consultation',
          description: 'Review results and treatment plan',
          durationMinutes: 20,
          price: 0,
          bufferMinutes: 5,
          serviceType: 'consultation',
        },
      ],
    },
    {
      name: 'Laboratory',
      sortOrder: 1,
      services: [
        {
          name: 'Complete blood count',
          description: 'CBC with differential',
          durationMinutes: 15,
          price: 25,
          serviceType: 'lab_test',
          requiresFasting: false,
        },
        {
          name: 'Lipid panel',
          description: 'Cholesterol and triglycerides',
          durationMinutes: 15,
          price: 35,
          serviceType: 'lab_test',
          requiresFasting: true,
          preparationNotes: 'Fast for 12 hours before sample collection',
        },
        {
          name: 'Thyroid panel',
          durationMinutes: 15,
          price: 40,
          serviceType: 'lab_test',
        },
      ],
    },
    {
      name: 'Cardiology',
      sortOrder: 2,
      services: [
        {
          name: 'Cardiology consultation',
          durationMinutes: 45,
          price: 80,
          bufferMinutes: 10,
          serviceType: 'consultation',
        },
        {
          name: 'ECG',
          description: '12-lead electrocardiogram',
          durationMinutes: 30,
          price: 50,
          serviceType: 'procedure',
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
          startTime: '09:00',
          endTime: '17:00',
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
      name: 'Saturday clinic hours',
      applyDays: [6],
      repeatWeeksCount: 4,
      timePeriods: [
        {
          startTime: '09:00',
          endTime: '13:00',
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

const TOUR_PLAYBOOK: VerticalPlaybook = {
  id: 'tour',
  labelKey: 'onboarding.playbooks.tour',
  descriptionKey: 'onboarding.playbooks.tourDesc',
  categories: [
    {
      name: 'Day Tours',
      sortOrder: 0,
      services: [
        {
          name: 'Full Day City Tour',
          description: 'Guided highlights of the city with lunch stop',
          durationMinutes: 480,
          price: 85,
          bufferMinutes: 0,
          serviceType: 'tour',
          coverImage: '/placeholders/tours/city-day.jpg',
          maxGroupSize: 12,
          difficulty: 'easy',
          meetingPoint: 'Main hotel lobby',
          includedItems: 'Transport, guide, lunch',
          durationDays: 1,
        },
        {
          name: 'Sunset Coastal Drive',
          description: 'Scenic coastal route with photo stops',
          durationMinutes: 300,
          price: 65,
          serviceType: 'tour',
          coverImage: '/placeholders/tours/coastal.jpg',
          maxGroupSize: 10,
          difficulty: 'easy',
          durationDays: 1,
        },
      ],
    },
    {
      name: 'Multi-Day Tours',
      sortOrder: 1,
      services: [
        {
          name: '3-Day Mountain Trek',
          description: 'Guided trek with overnight camps',
          durationMinutes: 4320,
          price: 320,
          serviceType: 'tour',
          coverImage: '/placeholders/tours/mountain-trek.jpg',
          maxGroupSize: 8,
          difficulty: 'challenging',
          meetingPoint: 'Trailhead visitor center',
          includedItems: 'Guide, camping gear, meals',
          durationDays: 3,
        },
        {
          name: 'Weekend Heritage Tour',
          description: 'Two days of UNESCO sites and local cuisine',
          durationMinutes: 2880,
          price: 195,
          serviceType: 'tour',
          coverImage: '/placeholders/tours/heritage.jpg',
          maxGroupSize: 14,
          difficulty: 'moderate',
          durationDays: 2,
        },
      ],
    },
    {
      name: 'Private Tours',
      sortOrder: 2,
      services: [
        {
          name: 'Private Wine Country Day',
          description: 'Custom itinerary for your group',
          durationMinutes: 480,
          price: 240,
          serviceType: 'tour',
          coverImage: '/placeholders/tours/wine-country.jpg',
          maxGroupSize: 6,
          difficulty: 'moderate',
          durationDays: 1,
        },
      ],
    },
  ],
  scheduleTemplates: [
    {
      name: 'Tour operating hours',
      applyDays: [0, 1, 2, 3, 4, 5, 6],
      repeatWeeksCount: 4,
      timePeriods: [
        {
          startTime: '08:00',
          endTime: '18:00',
          type: TemplatePeriodType.SERVICE_BLOCK,
          isActiveOnMonday: true,
          isActiveOnTuesday: true,
          isActiveOnWednesday: true,
          isActiveOnThursday: true,
          isActiveOnFriday: true,
          isActiveOnSaturday: true,
          isActiveOnSunday: true,
          maxAppointmentCount: 1,
        },
      ],
    },
  ],
};

export const VERTICAL_PLAYBOOKS: Record<VerticalPlaybookId, VerticalPlaybook> =
  {
    salon: SALON_PLAYBOOK,
    clinic: CLINIC_PLAYBOOK,
    tour: TOUR_PLAYBOOK,
  };

/** Maps onboarding business types to salon vs clinic playbook bundles. */
export const BUSINESS_TYPE_TO_PLAYBOOK: Record<string, VerticalPlaybookId> = {
  hair_salon: 'salon',
  barbershop: 'salon',
  nail_salon: 'salon',
  spa: 'salon',
  massage: 'salon',
  clinic: 'clinic',
  polyclinic: 'clinic',
  beauty_clinic: 'clinic',
  dental: 'clinic',
  tour_operator: 'tour',
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
