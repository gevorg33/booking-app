import type { ConsumerStoreListing, StoreListingLocale } from './store-listing.types.js';

export const CONSUMER_STORE_LISTINGS: Record<StoreListingLocale, ConsumerStoreListing> = {
  en: {
    locale: 'en',
    ios: {
      title: 'OptiSchedule — Book Salons',
      subtitle: 'Appointments in a few taps',
      keywords: 'salon,booking,appointment,hair,nails,spa,beauty,schedule,barber',
      promotionalText:
        'Scan your salon QR or open their booking link — the app remembers where you wanted to go.',
      description: [
        'Book beauty and wellness appointments at salons you already trust.',
        '',
        '• Open a link or scan a QR at your salon — land directly on their services',
        '• See real availability and pick your stylist',
        '• Confirm in seconds; manage upcoming visits from one place',
        '• Rebook with one tap; switch between salons without losing your account',
        '',
        'OptiSchedule is the customer app for businesses that run on OptiSchedule. Your salon sends you a link — you book in the app.',
      ].join('\n'),
    },
    android: {
      title: 'OptiSchedule — Book Salons',
      shortDescription: 'Book beauty & wellness appointments at your favorite salon.',
      fullDescription: [
        'Book beauty and wellness appointments at salons you already trust.',
        '',
        'OPEN YOUR SALON INSTANTLY',
        'Scan a QR at the front desk or tap a booking link — the app opens on that salon\'s menu. No searching, no re-entering the salon code.',
        '',
        'BOOK IN A FEW TAPS',
        'Browse services, see open times, choose your provider, and confirm. Your upcoming visits stay in one place.',
        '',
        'RETURN ANYTIME',
        'Recent and saved salons on the home screen. Switch between salons you\'ve booked before without signing in again.',
        '',
        'OptiSchedule is the customer app for OptiSchedule-powered salons, clinics, and studios.',
      ].join('\n'),
    },
  },
  hy: {
    locale: 'hy',
    ios: {
      title: 'OptiSchedule — Սրահ ամրագրում',
      subtitle: 'Ամրագրում մի քանի հպումով',
      keywords: 'salon,amragrum,gorcakic,matna,hair,nails,spa,beauty,barber,wellness',
      promotionalText:
        'Սканավորեք սրահի QR-ը կամ բացեք ամրագրման հղումը — հավելվածը հիշում է ձեր սրահը։',
      description: [
        'Ամրագրեք գեղեցկության և wellness ծառայություններ այն սրահներում, որտեղ արդեն հաճախում եք։',
        '',
        '• Բացեք հղումը կամ սканավորեք QR-ը — անմիջապես բացվում են ծառայությունները',
        '• Տեսեք ազատ ժամերն և ընտրեք մասնագետ',
        '• Հաստատեք վայրկյաններում, կառավարեք գրանցումները մեկ տեղից',
        '• Մեկ հպումով կրկնակի ամրագրում, հեշտ անցում սրահների միջև',
        '',
        'OptiSchedule-ը հաճախորդների հավելվածն է OptiSchedule-ով աշխատող բիզնեսների համար։',
      ].join('\n'),
    },
    android: {
      title: 'OptiSchedule — Սրահ ամրագրում',
      shortDescription: 'Ամրագրեք գեղեցկության և wellness ծառայություններ ձեր սրահում։',
      fullDescription: [
        'Ամրագրեք գեղեցկության և wellness ծառայություններ այն սրահներում, որտեղ արդեն հաճախում եք։',
        '',
        'ԲԱՑԵՔ ՁԵՐ ՍՐԱՀԸ ԱՆՄԻՋԱՊԵՍ',
        'Սканավորեք QR-ը կամ սեղմեք ամրագրման հղումը — հավելվածը բացում է հենց այդ սրահի մենյուն։',
        '',
        'ԱՄՐագրում մի քանի հպումով',
        'Ընտրեք ծառայություն, ժամ և մասնագետ, հաստատեք։ Բոլոր գրանցումները մեկ տեղում են։',
        '',
        'Վերադարձեք ցանկացած ժամ',
        'Վերջին և պահպանված սրահներ գլխավոր էկրանին։ Անցեք սրահների միջև առանց կրկին մուտք գործելու։',
      ].join('\n'),
    },
  },
  ru: {
    locale: 'ru',
    ios: {
      title: 'OptiSchedule — Запись в салон',
      subtitle: 'Запись в несколько касаний',
      keywords: 'salon,booking,zapis,strizhka,manikyur,spa,beauty,barber,wellness',
      promotionalText:
        'Отсканируйте QR салона или откройте ссылку — приложение запомнит, куда вы хотели попасть.',
      description: [
        'Записывайтесь на услуги красоты и wellness в салонах, которым уже доверяете.',
        '',
        '• Откройте ссылку или QR — сразу попадёте в меню услуг салона',
        '• Свободное время и выбор мастера',
        '• Подтверждение за секунды; все записи в одном месте',
        '• Повторная запись в одно касание; переключение между салонами',
        '',
        'OptiSchedule — приложение для клиентов салонов и студий на платформе OptiSchedule.',
      ].join('\n'),
    },
    android: {
      title: 'OptiSchedule — Запись в салон',
      shortDescription: 'Запись на услуги красоты и wellness в вашем салоне.',
      fullDescription: [
        'Записывайтесь на услуги красоты и wellness в салонах, которым уже доверяете.',
        '',
        'ОТКРОЙТЕ САЛОН СРАЗУ',
        'QR на стойке или ссылка на запись — приложение открывается на меню этого салона.',
        '',
        'ЗАПИСЬ В НЕСКОЛЬКО КАСАНИЙ',
        'Услуга, время, мастер, подтверждение. Предстоящие визиты — в одном месте.',
        '',
        'ВОЗВРАЩАЙТЕСЬ ЛЕГКО',
        'Недавние и сохранённые салоны на главном экране. Переключайтесь без повторного входа.',
      ].join('\n'),
    },
  },
};

export const CONSUMER_STORE_LISTING_IDS = [
  { id: 'en-listing', locale: 'en' as const },
  { id: 'hy-listing', locale: 'hy' as const },
  { id: 'ru-listing', locale: 'ru' as const },
];
