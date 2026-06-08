import type { StoreListingPreviewScene } from './store-listing.types.js';

/** 30s App Store preview / Play feature video storyboard (adopt-2.1) */
export const CONSUMER_STORE_PREVIEW_VIDEO_SCENES: StoreListingPreviewScene[] = [
  {
    id: 'web-banner',
    startSec: 0,
    endSec: 5,
    visual: {
      en: 'Public booking page with violet smart app banner',
      hy: 'Հանրային ամրագրման էջ՝ բջջային հավելվածի բանнерով',
      ru: 'Страница записи с фиолетовым баннером приложения',
    },
    onScreenText: {
      en: 'Open in app',
      hy: 'Բացել հավելվածում',
      ru: 'Открыть в приложении',
    },
  },
  {
    id: 'deferred-install',
    startSec: 5,
    endSec: 12,
    visual: {
      en: 'Install from App Store → app opens directly on salon services',
      hy: 'Տեղադրում App Store-ից → հավելվածը բացում է սրահի ծառայությունները',
      ru: 'Установка из Store → приложение открывается на услугах салона',
    },
    onScreenText: {
      en: 'Same salon, zero re-search',
      hy: 'Նույն սրահը, առանց նորից փնտրելու',
      ru: 'Тот же салон без повторного поиска',
    },
  },
  {
    id: 'book-flow',
    startSec: 12,
    endSec: 22,
    visual: {
      en: 'Service → time slot → confirm booking animation',
      hy: 'Ծառայություն → ժամ → ամրագրում',
      ru: 'Услуга → время → подтверждение',
    },
    onScreenText: {
      en: 'Book in a few taps',
      hy: 'Ամրագրում մի քանի հպումով',
      ru: 'Запись в несколько касаний',
    },
  },
  {
    id: 'success-review',
    startSec: 22,
    endSec: 30,
    visual: {
      en: 'Booking confirmed checkmark + optional rate-app prompt',
      hy: 'Հաստատված ամրագրում + գնահատման հրավեր',
      ru: 'Подтверждение записи + приглашение оценить',
    },
    onScreenText: {
      en: 'OptiSchedule — Book Salons',
      hy: 'OptiSchedule — Սրահ ամրագրում',
      ru: 'OptiSchedule — Запись в салон',
    },
  },
];

export const CONSUMER_PREVIEW_VIDEO_SPEC = {
  durationSec: 30,
  aspectRatio: '9:16' as const,
  formats: ['mp4', 'mov'] as const,
  maxFileSizeMb: 500,
  notes:
    'No PHI or real customer names in capture. Use demo tenant slug and synthetic booking data.',
};
