export interface PublicBranding {
  logoUrl?: string;
  primaryColor?: string;
  tagline?: string;
}

export interface PublicSocialLinks {
  website?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
  linkedin?: string;
  youtube?: string;
}

export interface PublicLocation {
  mapEmbedHtml?: string;
}

export interface PublicSupportWidgets {
  zendeskWidgetKey?: string;
}

export interface PublicMetaBooking {
  bookingUrl: string;
  buttonLabel: string;
  facebookPageUrl?: string;
  instagramUsername?: string;
}

export interface PublicMessagingLinks {
  publicBookingUrl: string;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  facebookBookingUrl?: string | null;
  instagramBookingUrl?: string | null;
}

export interface PublicBusinessTaxSettings {
  enabled: boolean;
  name: string;
  rate: number;
  model: 'inclusive' | 'exclusive';
  rules?: Array<{ name: string; rate: number }>;
}

export interface PublicBusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  locale: string;
  defaultLocale?: string;
  enabledLocales?: string[];
  dateFormat?: string;
  timeFormat?: string;
  currency: string;
  branding: PublicBranding;
  social?: PublicSocialLinks;
  location?: PublicLocation;
  support?: PublicSupportWidgets;
  metaBooking?: PublicMetaBooking;
  messaging?: PublicMessagingLinks;
  publicBookingEnabled: boolean;
  acceptCashPayments?: boolean;
  onlinePaymentsEnabled?: boolean;
  giftCardsPurchaseEnabled?: boolean;
  tax?: PublicBusinessTaxSettings;
  businessType?: string;
  multiService?: {
    enabled: boolean;
    maxServiceCount: number;
    maxDurationMinutes: number;
    turnoverBufferMinutes: number;
    schedulingMode: 'same_visit' | 'per_service';
    incompatiblePairMode: 'service' | 'category';
    incompatiblePairs: Array<[string, string]>;
    incompatibleCategoryPairs: Array<[string, string]>;
  };
}

export interface PublicCheckoutAdjustment {
  type: 'promo' | 'gift_card' | 'loyalty';
  code?: string;
  label: string;
  amount: number;
  points?: number;
}

export interface PublicCheckoutQuote {
  servicePrice: number;
  subtotal: number;
  afterPromo?: number;
  afterGiftCard?: number;
  promoDiscount?: number;
  giftCardDiscount?: number;
  loyaltyDiscount?: number;
  totalDiscount?: number;
  amountDue: number;
  taxEnabled?: boolean;
  taxName?: string | null;
  taxRate?: number | null;
  taxModel?: 'inclusive' | 'exclusive' | null;
  taxAmount?: number;
  netAmount?: number;
  taxRules?: Array<{ id: string; name: string; rate: number; amount: number }>;
  currency: string;
  loyaltyPointsToRedeem?: number;
  loyaltyPointsBalance?: number | null;
  pointsToEarn?: number;
  promoCode?: string;
  giftCardCode?: string;
  adjustments?: PublicCheckoutAdjustment[];
}

export interface PublicCustomerLoyalty {
  pointsBalance: number;
  lifetimeEarned: number;
  bonusDollarValue: number;
  earnPercentCashback: number;
  pointsValue: number;
}

export interface PublicProviderSlot {
  startTime: string;
  endTime: string;
}

export interface PublicProviderReview {
  id: string;
  rating: number;
  comment: string | null;
  customerName: string | null;
  createdAt: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  role?: string | null;
  avatarUrl?: string | null;
  nearestDate?: string | null;
  nearestDateLabel?: string | null;
  slots: PublicProviderSlot[];
  averageRating: number | null;
  reviewCount: number;
  recentReviews?: PublicProviderReview[];
}

export interface PublicProviderReviewsPage {
  employeeId: string;
  employeeName: string;
  employeeRole: string | null;
  avatarUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: PublicProviderReview[];
}

export interface PublicServiceCategory {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface PublicService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferMinutes?: number;
  price: number;
  currency?: string | null;
  onlinePaymentEnabled?: boolean;
  prepaymentMode?: 'none' | 'deposit' | 'full';
  depositAmount?: number | null;
  category?: PublicServiceCategory | null;
  hasSubscriptionPlans?: boolean;
  isTour?: boolean;
  tourDurationBadge?: string;
  coverImage?: string;
  maxGroupSize?: number;
  difficulty?: 'easy' | 'moderate' | 'challenging';
  meetingPoint?: string;
  includedItems?: string;
  durationDays?: number;
  dayLevelBooking?: boolean;
  pricePerPerson?: boolean;
  isClinic?: boolean;
  clinicServiceType?: 'consultation' | 'lab_test' | 'procedure';
  clinicServiceTypeBadge?: string;
  requiresFasting?: boolean;
  acceptsPatientNotes?: boolean;
  offersPreVisitIntake?: boolean;
  preparationNotes?: string;
}

export interface PublicRecommendationProduct {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  externalLink?: string;
  price?: number;
}

export interface PublicSlot {
  startTime: string;
  endTime: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PublicServiceDaySlots {
  date: string;
  serviceId: string;
  serviceName: string;
  slots: PublicSlot[];
  remainingSpots?: number | null;
}

export interface PublicCustomerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PublicCustomerBookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage?: string | null;
  rescheduleCount?: number;
  maxReschedules?: number;
  allowProviderChangeOnReschedule?: boolean;
  packagePurchaseId?: string | null;
  packageId?: string | null;
  packageName?: string | null;
}

export interface PublicPackageVisitAppointment {
  bookingId: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
  status: string;
  canCancel: boolean;
  canReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
}

export interface PublicPackageVisitSummary {
  packagePurchaseId: string;
  packageId: string | null;
  packageName: string;
  appointments: PublicPackageVisitAppointment[];
  canCancelAll: boolean;
  canRescheduleAll: boolean;
  policyMessage: string | null;
  allowProviderChangeOnReschedule: boolean;
}

export interface PublicBookingManageContext {
  bookingId: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  serviceName: string;
  employeeName: string;
  employeeId: string;
  serviceId: string;
  canCancel: boolean;
  canReschedule: boolean;
  policyMessage: string | null;
  allowProviderChangeOnReschedule: boolean;
  rescheduleCount: number;
  maxReschedules: number;
  packageVisit?: PublicPackageVisitSummary;
}

export type PackageVisitRescheduleLine = {
  bookingId: string;
  startTime: string;
  employeeId?: string;
};

export interface PublicSubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  includedAppointments: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  preview: {
    pricing: {
      regularTotal: number;
      subscriptionPrice: number;
      savings: number;
      perAppointmentPrice: number;
    };
  };
}

export interface PublicCustomerSubscription {
  id: string;
  planName?: string;
  status: string;
  appointmentsRemaining: number;
  appointmentsIncluded?: number;
  expiresAt: string;
  plan?: { name: string; service?: { id: string; name: string } };
}

export interface PublicSubscriptionUsageRow {
  id: string;
  action: string;
  appointmentsRemainingAfter: number;
  createdAt: string;
}
