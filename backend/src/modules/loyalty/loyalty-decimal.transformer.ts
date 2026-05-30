import { ValueTransformer } from 'typeorm';

export const loyaltyDecimalTransformer: ValueTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value == null ? 0 : parseFloat(value)),
};
