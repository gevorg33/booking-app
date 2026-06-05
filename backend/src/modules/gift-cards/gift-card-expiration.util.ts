import { BadRequestException } from '@nestjs/common';

export type GiftCardExpirationAction = 'set' | 'extend' | 'clear';

export interface UpdateGiftCardExpirationInput {
  expiresAt?: string | null;
  extendMonths?: number;
  extendDays?: number;
  note?: string;
}

export interface GiftCardExpirationUpdateResult {
  expiresAt: Date | null;
  action: GiftCardExpirationAction;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * DAY_MS;

/** End of UTC day — valid through the selected calendar day. */
export function parseExpiresAtDay(day: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day.trim())) {
    throw new BadRequestException('expiresAt must be a YYYY-MM-DD date');
  }
  return new Date(`${day.trim()}T23:59:59.999Z`);
}

export function parseExpiresAtInput(value: string): Date {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return parseExpiresAtDay(trimmed);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid expiration date');
  }
  return parsed;
}

export function resolveGiftCardExpirationUpdate(
  previous: Date | null | undefined,
  input: UpdateGiftCardExpirationInput,
  now: Date = new Date(),
): GiftCardExpirationUpdateResult {
  const hasExtend =
    input.extendMonths !== undefined || input.extendDays !== undefined;
  const hasSet = input.expiresAt !== undefined && input.expiresAt !== null;
  const wantsClear = input.expiresAt === null && !hasExtend;

  if (wantsClear) {
    return { expiresAt: null, action: 'clear' };
  }

  if (hasExtend) {
    const months = Number(input.extendMonths ?? 0);
    const days = Number(input.extendDays ?? 0);
    if (
      !Number.isFinite(months) ||
      !Number.isFinite(days) ||
      months < 0 ||
      days < 0
    ) {
      throw new BadRequestException(
        'extendMonths and extendDays must be non-negative numbers',
      );
    }
    if (months === 0 && days === 0) {
      throw new BadRequestException(
        'Provide extendMonths or extendDays to extend expiration',
      );
    }
    if (hasSet) {
      throw new BadRequestException(
        'Use either expiresAt or extendMonths/extendDays, not both',
      );
    }

    const base =
      previous && previous.getTime() > now.getTime() ? previous : now;
    const expiresAt = new Date(
      base.getTime() + months * MONTH_MS + days * DAY_MS,
    );
    return { expiresAt, action: 'extend' };
  }

  if (hasSet && typeof input.expiresAt === 'string') {
    return { expiresAt: parseExpiresAtInput(input.expiresAt), action: 'set' };
  }

  throw new BadRequestException(
    'Provide expiresAt (YYYY-MM-DD or ISO), expiresAt: null to clear, or extendMonths/extendDays',
  );
}
