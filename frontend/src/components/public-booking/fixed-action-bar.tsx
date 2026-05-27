'use client';

interface FixedActionBarProps {
  primaryColor: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

/** Bottom action bar — container is click-through so time slots stay selectable underneath. */
export function FixedActionBar({ primaryColor, disabled, label, onClick }: FixedActionBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none bg-gradient-to-t from-[#f5f5f7] via-[#f5f5f7]/95 to-transparent pt-6">
      <div className="max-w-lg mx-auto px-4 pb-4 pointer-events-none">
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={`block w-full text-center py-3.5 rounded-2xl font-semibold text-white transition-opacity pointer-events-auto ${
            disabled ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-95'
          }`}
          style={{ backgroundColor: primaryColor }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
