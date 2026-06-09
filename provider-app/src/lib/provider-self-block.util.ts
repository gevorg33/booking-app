/** prov-exp-7.1 — provider schedule self-block form helpers. */

export interface ProviderSelfBlockFormInput {
  date: string;
  startTime: string;
  endTime: string;
  placeholder?: string;
}

export const PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX = 64;

export const PROVIDER_SELF_BLOCK_PRESETS = [
  {
    id: 'lunch',
    startTime: '12:00',
    endTime: '13:00',
    placeholder: 'Lunch',
  },
  {
    id: 'break',
    startTime: '15:00',
    endTime: '15:15',
    placeholder: 'Break',
  },
] as const;

export function isProviderSelfBlockFormValid(
  input: ProviderSelfBlockFormInput,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim())) return false;
  if (!/^\d{2}:\d{2}$/.test(input.startTime.trim())) return false;
  if (!/^\d{2}:\d{2}$/.test(input.endTime.trim())) return false;
  return input.endTime > input.startTime;
}

export function buildProviderSelfBlockPayload(
  input: ProviderSelfBlockFormInput,
): ProviderSelfBlockFormInput | null {
  const date = input.date.trim();
  const startTime = input.startTime.trim();
  const endTime = input.endTime.trim();
  const placeholder = input.placeholder?.trim().slice(0, PROVIDER_SELF_BLOCK_PLACEHOLDER_MAX);

  const payload: ProviderSelfBlockFormInput = {
    date,
    startTime,
    endTime,
    placeholder: placeholder || undefined,
  };

  return isProviderSelfBlockFormValid(payload) ? payload : null;
}
