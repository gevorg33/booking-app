export const GDPR_BREACH_NOTIFICATION_HOURS = 72;

export interface BreachNotificationDraft {
  subject: string;
  body: string;
  affectedCustomerCount: number;
}

export function computeGdprNotificationDeadline(reportedAt: Date): Date {
  return new Date(
    reportedAt.getTime() + GDPR_BREACH_NOTIFICATION_HOURS * 60 * 60 * 1000,
  );
}

export function isGdprDeadlineApproaching(
  deadline: Date,
  now = new Date(),
  withinHours = 24,
): boolean {
  const msRemaining = deadline.getTime() - now.getTime();
  return msRemaining > 0 && msRemaining <= withinHours * 60 * 60 * 1000;
}

export function isGdprDeadlineOverdue(
  deadline: Date,
  now = new Date(),
): boolean {
  return deadline.getTime() <= now.getTime();
}

export function buildBreachNotificationDraft(input: {
  businessName: string;
  incidentDescription: string;
  reportedAt: Date;
  affectedCustomerCount: number;
}): BreachNotificationDraft {
  const deadline = computeGdprNotificationDeadline(input.reportedAt);
  const deadlineLabel = deadline.toISOString();
  const subject = `Important security notice from ${input.businessName}`;
  const body = [
    `Dear customer,`,
    ``,
    `We are writing to inform you of a data security incident that may have affected your personal information held by ${input.businessName}.`,
    ``,
    `What happened:`,
    input.incidentDescription.trim(),
    ``,
    `We discovered this incident on ${input.reportedAt.toISOString()}. Under GDPR, we are notifying the supervisory authority within 72 hours (deadline: ${deadlineLabel}).`,
    ``,
    `What we are doing:`,
    `- Containing and investigating the incident`,
    `- Notifying affected individuals where required`,
    `- Reviewing safeguards to reduce the risk of recurrence`,
    ``,
    `What you can do:`,
    `- Monitor your accounts for unusual activity`,
    `- Contact us if you have questions about this notice`,
    ``,
    `We sincerely apologize for any concern this may cause.`,
    ``,
    `${input.businessName}`,
  ].join('\n');

  return {
    subject,
    body,
    affectedCustomerCount: input.affectedCustomerCount,
  };
}
