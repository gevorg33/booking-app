import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ClinicServiceEvalAction =
  | 'configure_clinic_service'
  | 'explain_clinic_services'
  | 'apply_clinic_playbook';

export interface ClinicServiceEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: ClinicServiceEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  needsMultilingual?: boolean;
}

/** Classifier guidance for Armenian/Russian clinic catalog phrasing (ai-cmd-clinic-4). */
export const CLINIC_SERVICE_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian clinic catalog (dashboard clinic|polyclinic):
  - configure_clinic_service: hy «նշի՛ր CBC-ն որպես լաբ թեստ ծոմավորով», «սահմանի՛ր lipid panel-ի նախապատրաստման կետերը», «դարձրու GP Consultation-ը խորհրդատվություն», «հանի՛ր ծոմավորի պահանջը CBC-ից»; ru «отметь CBC как лабораторный тест натощак», «установи инструкции подготовки для lipid panel», «сделай GP Consultation консультацией», «убери требование голодания для CBC». MUTATE one catalog service clinic metadata — NOT apply_clinic_playbook (vertical seed) and NOT explain_clinic_services (read list).
  - explain_clinic_services: hy «բացատրի՛ր մեր կլինիկական ծառայությունները», «որ լաբ թեստերն են ծոմավոր պահանջող», «քանի խորհրդատվություն ունենք», «ցույց տուր բաժինների քանակը»; ru «объясни наши клинические услуги», «какие лабораторные тесты требуют голодания», «сколько консультаций в каталоге», «покажи отделения и количество услуг». READ clinic catalog breakdown — NOT configure_clinic_service (mutate) and NOT explain_clinic_booking (checkout fields).
  - apply_clinic_playbook: hy «կիրառի՛ր կլինիկայի playbook-ը», «կարգավորի՛ր polyclinic starter catalog-ը»; ru «примени clinic playbook», «настрой стартовый каталог поликлиники». MUTATE vertical seed — NOT bulk_create_catalog.`;

export const MULTILINGUAL_CLINIC_SERVICE_EVAL_SCENARIOS: ClinicServiceEvalScenario[] =
  [
    {
      id: 'hy-configure-cbc-lab-fasting',
      locale: 'hy',
      prompt: 'Նշի՛ր CBC-ն որպես լաբ թեստ ծոմավորով',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'CBC',
        serviceType: 'lab_test',
        requiresFasting: true,
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-lipid-prep',
      locale: 'hy',
      prompt: 'Սահմանի՛ր lipid panel-ի նախապատրաստման կետերը՝ 12 ժամ ծոմավոր',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'lipid panel',
        preparationNotes: '12 ժամ ծոմավոր',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-gp-consultation',
      locale: 'hy',
      prompt: 'Դարձրու GP Consultation-ը խորհրդատվություն',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'GP Consultation',
        serviceType: 'consultation',
      },
      needsMultilingual: true,
    },
    {
      id: 'hy-configure-cbc-no-fasting',
      locale: 'hy',
      prompt: 'Հանի՛ր ծոմավորի պահանջը CBC-ից',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: { serviceName: 'CBC', requiresFasting: false },
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-clinic-services',
      locale: 'hy',
      prompt: 'Բացատրի՛ր մեր կլինիկական ծառայությունները և բաժինները',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-fasting-labs',
      locale: 'hy',
      prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-explain-consultation-count',
      locale: 'hy',
      prompt: 'Քանի խորհրդատվություն ունենք կատալոգում',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'hy-apply-clinic-playbook',
      locale: 'hy',
      prompt: 'Կիրառի՛ր կլինիկայի playbook-ը',
      expectedAction: 'apply_clinic_playbook',
      rescueReason: 'apply_clinic_playbook',
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-cbc-lab-fasting',
      locale: 'ru',
      prompt: 'Отметь CBC как лабораторный тест натощак',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'CBC',
        serviceType: 'lab_test',
        requiresFasting: true,
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-lipid-prep',
      locale: 'ru',
      prompt: 'Установи инструкции подготовки для lipid panel — голод 12 часов',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'lipid panel',
        preparationNotes: 'голод 12 часов',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-configure-gp-consultation',
      locale: 'ru',
      prompt: 'Сделай GP Consultation консультацией',
      expectedAction: 'configure_clinic_service',
      rescueReason: 'configure_clinic_service',
      paramsPartial: {
        serviceName: 'GP Consultation',
        serviceType: 'consultation',
      },
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-clinic-catalog',
      locale: 'ru',
      prompt: 'Объясни наши клинические услуги и количество отделений',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-fasting-labs',
      locale: 'ru',
      prompt: 'Какие лабораторные тесты требуют голодания',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-lab-vs-consultation',
      locale: 'ru',
      prompt: 'Сколько лабораторных тестов и консультаций в каталоге',
      expectedAction: 'explain_clinic_services',
      rescueReason: 'explain_clinic_services',
      needsMultilingual: true,
    },
    {
      id: 'ru-apply-clinic-playbook',
      locale: 'ru',
      prompt: 'Примени clinic playbook для поликлиники',
      expectedAction: 'apply_clinic_playbook',
      rescueReason: 'apply_clinic_playbook',
      needsMultilingual: true,
    },
  ];
