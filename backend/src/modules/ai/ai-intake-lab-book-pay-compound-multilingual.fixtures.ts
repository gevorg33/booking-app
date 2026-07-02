import type { IntakeLabBookPayCompoundFixture } from './ai-intake-lab-book-pay-compound.fixtures.js';

export const INTAKE_LAB_BOOK_PAY_MULTILINGUAL_CLASSIFIER_RULES = `- intake_lab_book_pay HY/RU: hy «Լրացրու հարցաթերթիկը, ամրագրիր արյան վերցում, վճարի ավանդ»; ru «Заполни анкету, забронируй забор крови, оплати депозит онлайн». Intake → lab slot → pay — NOT complete_intake_and_book without payment.`;

export type IntakeLabBookPayMultilingualScenario =
  IntakeLabBookPayCompoundFixture & {
    locale: 'hy' | 'ru';
  };

export const INTAKE_LAB_BOOK_PAY_MULTILINGUAL_SCENARIOS: readonly IntakeLabBookPayMultilingualScenario[] =
  [
    {
      id: 'intake-lab-pay-hy-customer',
      prompt: 'Լրացրու հարցաթերթիկը, ամրագրիր արյան վերցում, վճարի ավանդ',
      surface: 'customer',
      locale: 'hy',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      serviceName: 'blood draw',
      paymentAction: 'pay_online',
    },
    {
      id: 'intake-lab-pay-hy-public',
      prompt: 'Լրացնել անկետը, գրանցել լաբ թեստ, վճարել օնլայն',
      surface: 'public',
      locale: 'hy',
      orderedActions: [
        'complete_intake_and_book',
        'book_appointment',
        'pay_online',
      ],
      serviceName: 'lab test',
      paymentAction: 'pay_online',
    },
    {
      id: 'intake-lab-pay-ru-customer',
      prompt: 'Заполни анкету, забронируй забор крови, оплати депозит онлайн',
      surface: 'customer',
      locale: 'ru',
      orderedActions: [
        'complete_intake_and_book',
        'book_nearest_slot',
        'pay_online',
      ],
      serviceName: 'blood draw',
      paymentAction: 'pay_online',
    },
    {
      id: 'intake-lab-pay-ru-public',
      prompt: 'Заполнить форму, записаться на анализ крови, оплатить картой',
      surface: 'public',
      locale: 'ru',
      orderedActions: [
        'complete_intake_and_book',
        'book_appointment',
        'pay_online',
      ],
      serviceName: 'blood draw',
      paymentAction: 'pay_online',
    },
  ];
