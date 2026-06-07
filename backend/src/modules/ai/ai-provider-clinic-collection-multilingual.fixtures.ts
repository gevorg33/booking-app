import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { ProviderClinicCollectionIntent } from './ai-provider-clinic-collection.util.js';

export interface ProviderClinicCollectionEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ProviderClinicCollectionIntent;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Armenian/Russian provider specimen collection queue (i18n-clinic-v2-ai-4). */
export const PROVIDER_CLINIC_COLLECTION_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian provider specimen collection (provider mobile only):
  - list_my_collection_queue: hy «ցույց տուր իմ հավաքման հերթականությունը», «ինչ կա նմուշի հավաքման հերթում», «ումից արյուն վերցնեմ այսօր»; ru «покажи мою очередь на забор», «что в очереди забора образцов», «у кого взять кровь сегодня». Own worklist — NOT list_bookings and NOT dashboard list_test_orders.
  - mark_specimen_collected: hy «նշիր նմուշը հավաքված», «նմուշը հավաքված է», «ավարտեցի արյան վերցումը» + հիվանդ/specimen id; ru «отметь образец собранным», «образец собран», «закончил забор» + пациент/specimen id. NOT mark_paid and NOT enter_test_result.`;

export const MULTILINGUAL_PROVIDER_CLINIC_COLLECTION_EVAL_SCENARIOS: ProviderClinicCollectionEvalScenario[] =
  [
    {
      id: 'hy-my-collection-queue',
      locale: 'hy',
      prompt: 'Ցույց տուր իմ հավաքման հերթականությունը այսօր',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-specimen-queue-today',
      locale: 'hy',
      prompt: 'Ինչ կա իմ նմուշի հավաքման հերթականությունում այսօր',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-list-worklist-today',
      locale: 'hy',
      prompt: 'Ցուցակավորիր իմ collection queue-ն այսօր',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-lab-collection-queue',
      locale: 'hy',
      prompt: 'Իմ լաբորատոր հավաքման հերթականությունը',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-draw-list-today',
      locale: 'hy',
      prompt: 'Ումից պետք է արյուն վերցնեմ այսօր',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-worklist-today',
      locale: 'hy',
      prompt: 'Ցույց տուր այսօրվա collection worklist-ը',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'hy-mark-maria',
      locale: 'hy',
      prompt: 'Նշիր նմուշը հավաքված Մարիայի համար',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-maria-specimen-collected',
      locale: 'hy',
      prompt: 'Նշիր Մարիայի նմուշը որպես հավաքված',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-john-collected',
      locale: 'hy',
      prompt: 'Նմուշը հավաքված է հիվանդ Ջոնի համար',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Ջոն' },
      needsMultilingual: true,
    },
    {
      id: 'hy-cbc-maria',
      locale: 'hy',
      prompt: 'Նշիր հավաքված CBC նմուշը Մարիայի համար',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'hy-specimen-id',
      locale: 'hy',
      prompt: 'Նշիր նմուշը #abc123 հավաքված',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { specimenId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'hy-done-drawing-maria',
      locale: 'hy',
      prompt: 'Ավարտեցի արյան վերցումը Մարիայի հետ — նշիր նմուշը հավաքված',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Մարիա' },
      needsMultilingual: true,
    },
    {
      id: 'ru-my-collection-queue',
      locale: 'ru',
      prompt: 'Покажи мою очередь на забор сегодня',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-specimen-queue-today',
      locale: 'ru',
      prompt: 'Что в моей очереди забора образцов сегодня',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-list-worklist-today',
      locale: 'ru',
      prompt: 'Список моей collection queue на сегодня',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-lab-collection-queue',
      locale: 'ru',
      prompt: 'Моя лабораторная очередь на забор',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-draw-list-today',
      locale: 'ru',
      prompt: 'У кого мне нужно взять кровь сегодня',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-worklist-today',
      locale: 'ru',
      prompt: 'Покажи сегодняшний collection worklist',
      expectedAction: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
      needsMultilingual: true,
    },
    {
      id: 'ru-mark-maria',
      locale: 'ru',
      prompt: 'Отметь образец собранным для Марии',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-maria-specimen-collected',
      locale: 'ru',
      prompt: 'Отметь образец Марии как собранный',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-john-collected',
      locale: 'ru',
      prompt: 'Образец собран для пациента Джона',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Джон' },
      needsMultilingual: true,
    },
    {
      id: 'ru-cbc-maria',
      locale: 'ru',
      prompt: 'Отметь собранным CBC образец для Марии',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
    {
      id: 'ru-specimen-id',
      locale: 'ru',
      prompt: 'Отметь образец #abc123 собранным',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { specimenId: 'abc123' },
      needsMultilingual: true,
    },
    {
      id: 'ru-done-drawing-maria',
      locale: 'ru',
      prompt: 'Закончил забор у Марии — отметь образец собранным',
      expectedAction: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
      paramsPartial: { customerName: 'Мария' },
      needsMultilingual: true,
    },
  ];
