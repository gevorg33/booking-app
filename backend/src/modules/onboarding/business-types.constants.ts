export interface CatalogServiceDraft {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  bufferMinutes?: number;
}

export interface CatalogCategoryDraft {
  name: string;
  sortOrder: number;
  services: CatalogServiceDraft[];
}

export interface BusinessTypeOption {
  id: string;
  labelKey: string;
  descriptionKey: string;
}

export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] = [
  { id: 'hair_salon', labelKey: 'onboarding.types.hairSalon', descriptionKey: 'onboarding.types.hairSalonDesc' },
  { id: 'barbershop', labelKey: 'onboarding.types.barbershop', descriptionKey: 'onboarding.types.barbershopDesc' },
  { id: 'nail_salon', labelKey: 'onboarding.types.nailSalon', descriptionKey: 'onboarding.types.nailSalonDesc' },
  { id: 'spa', labelKey: 'onboarding.types.spa', descriptionKey: 'onboarding.types.spaDesc' },
  { id: 'beauty_clinic', labelKey: 'onboarding.types.beautyClinic', descriptionKey: 'onboarding.types.beautyClinicDesc' },
  { id: 'massage', labelKey: 'onboarding.types.massage', descriptionKey: 'onboarding.types.massageDesc' },
  { id: 'dental', labelKey: 'onboarding.types.dental', descriptionKey: 'onboarding.types.dentalDesc' },
  { id: 'other', labelKey: 'onboarding.types.other', descriptionKey: 'onboarding.types.otherDesc' },
];

const FALLBACK_CATALOGS: Record<string, CatalogCategoryDraft[]> = {
  hair_salon: [
    {
      name: 'Haircuts & styling',
      sortOrder: 0,
      services: [
        { name: "Women's haircut", durationMinutes: 60, price: 65 },
        { name: "Men's haircut", durationMinutes: 30, price: 35 },
        { name: 'Blowout & styling', durationMinutes: 45, price: 45 },
      ],
    },
    {
      name: 'Color & treatments',
      sortOrder: 1,
      services: [
        { name: 'Hair coloring', durationMinutes: 120, price: 120 },
        { name: 'Highlights / balayage', durationMinutes: 150, price: 180 },
        { name: 'Keratin hair mask', durationMinutes: 90, price: 95 },
      ],
    },
  ],
  barbershop: [
    {
      name: 'Barber services',
      sortOrder: 0,
      services: [
        { name: 'Classic haircut', durationMinutes: 30, price: 30 },
        { name: 'Skin fade', durationMinutes: 45, price: 40 },
        { name: 'Beard trim', durationMinutes: 20, price: 18 },
        { name: 'Hot towel shave', durationMinutes: 30, price: 35 },
      ],
    },
  ],
  nail_salon: [
    {
      name: 'Nails',
      sortOrder: 0,
      services: [
        { name: 'Classic manicure', durationMinutes: 45, price: 35 },
        { name: 'Gel manicure', durationMinutes: 60, price: 50 },
        { name: 'Classic pedicure', durationMinutes: 60, price: 45 },
        { name: 'Nail art add-on', durationMinutes: 20, price: 15 },
      ],
    },
  ],
  spa: [
    {
      name: 'Facials & skin',
      sortOrder: 0,
      services: [
        { name: 'Express facial', durationMinutes: 30, price: 55 },
        { name: 'Deep cleansing facial', durationMinutes: 60, price: 90 },
        { name: 'Anti-aging facial', durationMinutes: 75, price: 110 },
      ],
    },
    {
      name: 'Body treatments',
      sortOrder: 1,
      services: [
        { name: 'Swedish massage (60 min)', durationMinutes: 60, price: 85 },
        { name: 'Body scrub', durationMinutes: 45, price: 70 },
      ],
    },
  ],
  beauty_clinic: [
    {
      name: 'Aesthetics',
      sortOrder: 0,
      services: [
        { name: 'Consultation', durationMinutes: 30, price: 0 },
        { name: 'Botox treatment', durationMinutes: 30, price: 250 },
        { name: 'Dermal filler', durationMinutes: 45, price: 350 },
        { name: 'Laser hair removal (small area)', durationMinutes: 30, price: 80 },
      ],
    },
  ],
  massage: [
    {
      name: 'Massage',
      sortOrder: 0,
      services: [
        { name: 'Swedish massage (60 min)', durationMinutes: 60, price: 80 },
        { name: 'Deep tissue (60 min)', durationMinutes: 60, price: 95 },
        { name: 'Sports massage (45 min)', durationMinutes: 45, price: 75 },
      ],
    },
  ],
  dental: [
    {
      name: 'Dental care',
      sortOrder: 0,
      services: [
        { name: 'Dental check-up', durationMinutes: 30, price: 60 },
        { name: 'Teeth cleaning', durationMinutes: 45, price: 90 },
        { name: 'Teeth whitening', durationMinutes: 60, price: 200 },
      ],
    },
  ],
  other: [
    {
      name: 'General services',
      sortOrder: 0,
      services: [
        { name: 'Standard appointment', durationMinutes: 60, price: 50 },
        { name: 'Consultation', durationMinutes: 30, price: 0 },
      ],
    },
  ],
};

export function getFallbackCatalog(businessType: string): CatalogCategoryDraft[] {
  return FALLBACK_CATALOGS[businessType] ?? FALLBACK_CATALOGS.other;
}

export function isKnownBusinessType(id: string): boolean {
  return BUSINESS_TYPE_OPTIONS.some((t) => t.id === id);
}
