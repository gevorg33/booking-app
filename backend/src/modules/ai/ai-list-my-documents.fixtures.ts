import type { PatientDocumentCategory } from '../../common/utils/patient-document-category.util.js';

export type ListMyDocumentsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'list_my_documents';
  rescueReason: 'list_my_documents';
  category?: PatientDocumentCategory;
  title?: string;
};

export const CUSTOMER_LIST_MY_DOCUMENTS_CLASSIFIER_RULES = `- list_my_documents: READ — clinic only, logged-in customer: list released clinic documents (referral letters, imaging reports, PDFs) shown in the My documents section on My Results. Triggers: show my referral letter, where are my imaging reports, list my documents, my clinic documents, radiology reports, open my PDF. Optional category (referral_letter, imaging_report, lab_report, other) and title when a specific document is named. Requires sign-in. NOT list_my_test_results (numeric lab test results / My Results lab panel list), NOT track_lab_order_status (are results ready), NOT explain_result_status (status FAQ). Customer app only — NOT public booking page.`;

export const LIST_MY_DOCUMENTS_PROMPTS: readonly ListMyDocumentsPromptFixture[] =
  [
    {
      id: 'show-referral-letter',
      prompt: 'Show my referral letter',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'referral_letter',
    },
    {
      id: 'where-imaging-reports',
      prompt: 'Where are my imaging reports?',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'list-my-documents',
      prompt: 'List my documents',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
    {
      id: 'my-clinic-documents',
      prompt: 'Show my clinic documents',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
    {
      id: 'open-referral-pdf',
      prompt: 'Open my referral letter PDF',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'referral_letter',
    },
    {
      id: 'imaging-reports-account',
      prompt: 'What imaging reports do I have?',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'radiology-reports',
      prompt: 'Show my radiology reports',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'released-patient-documents',
      prompt: 'Show my released patient documents',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
    {
      id: 'referral-in-account',
      prompt: 'Do I have a referral letter in my account?',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'referral_letter',
    },
    {
      id: 'xray-reports',
      prompt: 'Where are my X-ray reports?',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'ultrasound-report',
      prompt: 'Show my ultrasound report',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'imaging_report',
    },
    {
      id: 'documents-in-my-results',
      prompt: 'What documents are in My Results?',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
    },
    {
      id: 'lab-report-pdf',
      prompt: 'Show my lab report PDF',
      surface: 'customer',
      expectedAction: 'list_my_documents',
      rescueReason: 'list_my_documents',
      category: 'lab_report',
    },
  ];

/** Blocks list_my_test_results when the user asks for clinic documents/PDFs. */
export const LIST_MY_DOCUMENTS_BLOCK = new RegExp(
  String.raw`\b(?:referral\s+letter|imaging\s+reports?|radiology\s+reports?|ultrasound\s+report|x-?ray\s+reports?|my\s+documents|clinic\s+documents|patient\s+documents|released\s+(?:patient\s+)?documents|lab\s+report\s+pdf|pdf\s+lab\s+report)\b|\b(?:documents?|pdfs?|files?)\b.{0,30}\b(?:my\s+results|account)\b|\b(?:my\s+results|account)\b.{0,30}\b(?:documents?|pdfs?)\b|(?:փաստաթղթ|ուղեգիր|պատկերագր|ուլտրա|սոնոգրաֆ)|(?:направлен|документ|снимк|рентген|МРТ|КТ|узи|отчёт\s+узи)`,
  'iu',
);

export const LIST_MY_DOCUMENTS_RESCUE_SCENARIOS = [
  {
    id: 'test-results-to-documents-referral',
    prompt: 'Show my referral letter',
    misclassifiedAction: 'list_my_test_results',
    expectedAction: 'list_my_documents' as const,
  },
  {
    id: 'unknown-to-documents-imaging',
    prompt: 'Where are my imaging reports?',
    misclassifiedAction: 'unknown',
    expectedAction: 'list_my_documents' as const,
  },
  {
    id: 'explain-to-documents-list',
    prompt: 'List my clinic documents',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'list_my_documents' as const,
  },
  {
    id: 'track-to-documents-radiology',
    prompt: 'Show my radiology reports',
    misclassifiedAction: 'track_lab_order_status',
    expectedAction: 'list_my_documents' as const,
  },
];
