'use client';

const CHIP_CLASS =
  'rounded-full border px-2.5 py-1 text-[11px] transition-colors';
const CHIP_IDLE =
  'border-amber-600/50 bg-amber-950/40 text-amber-100 hover:bg-amber-900/50';
const CHIP_SELECTED = 'border-amber-400 bg-amber-700/40 text-amber-50';

interface ClarifyChipGroupProps {
  options: Array<{ id: string; label: string; value: string }>;
  selected?: string;
  onSelect: (value: string) => void;
}

export function ClarifyChipGroup({ options, selected, onSelect }: ClarifyChipGroupProps) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`${CHIP_CLASS} ${isSelected ? CHIP_SELECTED : CHIP_IDLE}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ClarifyTimeSlotListProps {
  options: Array<{ id: string; label: string; value: string }>;
  selected?: string;
  onSelect: (value: string) => void;
}

export function ClarifyTimeSlotList({ options, selected, onSelect }: ClarifyTimeSlotListProps) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`rounded-md border px-2 py-1.5 text-left text-[11px] transition-colors ${
              isSelected
                ? 'border-amber-400 bg-amber-700/40 text-amber-50'
                : 'border-amber-600/40 bg-amber-950/30 text-amber-100 hover:bg-amber-900/40'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
