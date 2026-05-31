export const PROCESSOR_NAME = 'OptiSchedule';
export const PROCESSOR_LEGAL_NAME = 'OptiSchedule, Inc.';

export const DPA_TEMPLATE = `# Data Processing Agreement (DPA)

**Effective date:** {{dpaEffectiveDate}}

This Data Processing Agreement ("DPA") forms part of the agreement between **{{businessName}}** ("Controller") and **{{processorName}}** ("Processor") for the use of the OptiSchedule platform.

## 1. Subject matter and duration
Processor processes personal data on behalf of Controller to provide appointment scheduling, customer management, notifications, and related salon/clinic operations features. Processing continues for the term of the subscription and as required for data export or deletion.

## 2. Nature and purpose of processing
- Customer contact details (name, email, phone)
- Appointment history and preferences
- Marketing consent and GDPR preferences
- Payment metadata processed via Stripe Connect (Processor does not store full card numbers)

## 3. Categories of data subjects
Controller's customers, staff members, and business administrators.

## 4. Controller obligations
Controller represents that it has a lawful basis to collect and share personal data with Processor and will provide privacy notices to data subjects as required by applicable law.

## 5. Processor obligations
Processor shall:
- Process personal data only on documented instructions from Controller
- Ensure personnel with access are bound by confidentiality
- Implement appropriate technical and organizational measures (see Security One-Pager)
- Assist Controller with data subject requests where technically feasible
- Notify Controller without undue delay of personal data breaches affecting Controller data

## 6. Sub-processors
Processor uses infrastructure and communication sub-processors (cloud hosting, email/SMS delivery, payment processing). A current list is available in the Security One-Pager.

## 7. International transfers
Where personal data is transferred outside the EEA/UK, Processor relies on Standard Contractual Clauses or equivalent safeguards.

## 8. Data retention and deletion
Upon termination, Controller may export data via the dashboard. Processor deletes Controller data within 90 days of account closure unless retention is required by law.

## 9. Contact points
**Controller / DPO:** {{dpoEmail}}
**Registered address:** {{registeredAddress}}
**EU representative (if applicable):** {{euRepresentative}}

## 10. Additional terms
{{customDataProcessingNotes}}

---

*This template is provided for convenience and does not constitute legal advice. Have qualified counsel review before signing.*
`;

export const EU_PRIVACY_POLICY_TEMPLATE = `# Privacy Policy — {{businessName}}

**Effective date:** {{privacyPolicyEffectiveDate}}

{{businessName}} ("we", "us") operates in **{{country}}** and uses OptiSchedule to manage online bookings and customer communications.

## What we collect
- Contact information you provide when booking (name, email, phone)
- Appointment details and service history
- Marketing preferences and consent choices
- Technical data such as browser type for fraud prevention

## Why we use your data
- To confirm, remind, and manage your appointments
- To send service-related messages you opted into
- To send marketing only when you have opted in
- To improve our services and comply with legal obligations

## Legal bases (GDPR)
We rely on **contract** (booking fulfilment), **consent** (marketing), and **legitimate interests** (fraud prevention, service improvement) as applicable.

## Retention
We keep booking records as long as needed for operations and tax/accounting requirements, then delete or anonymize them.

## Your rights
Depending on your location, you may request access, correction, deletion, restriction, portability, or object to processing. Contact us at **{{dpoEmail}}**.

## Processors
We use OptiSchedule ({{processorName}}) as our scheduling platform. Payment card data is handled by Stripe; we do not store full card numbers.

## International transfers
If data is transferred outside your country, we ensure appropriate safeguards such as Standard Contractual Clauses.

## Contact
**{{businessName}}**
{{registeredAddress}}
Email: {{dpoEmail}}

---

*Customize this policy for your jurisdiction and have legal counsel review before publishing.*
`;

export const TRUST_PLACEHOLDERS = [
  'businessName',
  'processorName',
  'dpaEffectiveDate',
  'privacyPolicyEffectiveDate',
  'registeredAddress',
  'country',
  'dpoEmail',
  'euRepresentative',
  'customDataProcessingNotes',
] as const;
