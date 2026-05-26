'use client';

import { normalizeTime24, isValidTime24, isTimeInRange } from '@/lib/time-format';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  min?: string;
  max?: string;
}

/** 24-hour HH:mm text input for schedule period times. */
export function TimeInput({ value, onChange, className = 'input', id, min, max }: TimeInputProps) {
  const invalidFormat = value.length > 0 && !isValidTime24(value);
  const outOfRange = value.length > 0 && isValidTime24(value) && !isTimeInRange(value, min, max);

  return (
    <div>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`${className} font-mono tracking-wide`}
        placeholder="09:00"
        maxLength={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(normalizeTime24(value))}
      />
      {invalidFormat && (
        <p className="text-[10px] text-red-400 mt-0.5">Use 24h format HH:mm (e.g. 09:00, 17:30)</p>
      )}
      {!invalidFormat && outOfRange && min && max && (
        <p className="text-[10px] text-red-400 mt-0.5">Time must be between {min} and {max}</p>
      )}
    </div>
  );
}
