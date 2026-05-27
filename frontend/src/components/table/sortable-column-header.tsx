'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export function SortableColumnHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: 'ASC' | 'DESC';
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2 transition-colors ${
          active
            ? 'text-blue-400 bg-blue-600/15 ring-1 ring-blue-500/30'
            : 'text-blue-300/80 hover:text-blue-300 hover:bg-blue-600/10'
        }`}
        title={`Sort by ${label}`}
      >
        {label}
        {active ? (
          order === 'ASC' ? (
            <ArrowUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
        )}
      </button>
    </th>
  );
}
