'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mail, Phone, Search, User, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import type { CustomerListItem } from '@/lib/customer-types';

interface CustomerSelectProps {
  businessId: string;
  value: string;
  onChange: (customerId: string) => void;
  required?: boolean;
  searchPlaceholder?: string;
}

function formatCustomerLabel(customer: CustomerListItem) {
  return customer.name;
}

export function CustomerSelect({
  businessId,
  value,
  onChange,
  required,
  searchPlaceholder = 'Search by name, email, or phone…',
}: CustomerSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(inputValue, 300);

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', businessId, value],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/customers/${value}`);
      return (res.data || res) as CustomerListItem;
    },
    enabled: !!businessId && !!value,
  });

  const searchEnabled = open && !!businessId && !value;
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers-picker', businessId, debouncedSearch, open],
    queryFn: async () => {
      const params = new URLSearchParams({ pageSize: '20', sortBy: 'name', sortOrder: 'ASC' });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const { data: res } = await api.get(
        `/businesses/${businessId}/customers/dashboard?${params.toString()}`,
      );
      const payload = res.data || res;
      return (payload.customers ?? []) as CustomerListItem[];
    },
    enabled: searchEnabled,
  });

  const results = customers;

  useEffect(() => {
    if (!value) {
      setInputValue('');
      return;
    }
    if (selectedCustomer && document.activeElement !== inputRef.current) {
      setInputValue(formatCustomerLabel(selectedCustomer));
    }
  }, [value, selectedCustomer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        if (value && selectedCustomer) {
          setInputValue(formatCustomerLabel(selectedCustomer));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, selectedCustomer]);

  const handleInputChange = (next: string) => {
    setInputValue(next);
    setOpen(true);
    if (value) onChange('');
  };

  const handleSelect = (customer: CustomerListItem) => {
    onChange(customer.id);
    setInputValue(formatCustomerLabel(customer));
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setInputValue('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const showDropdown = open && !value;

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" value={value} required={required} readOnly tabIndex={-1} aria-hidden />

      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          autoComplete="off"
          className="input pl-9 pr-9"
          placeholder={searchPlaceholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
        />
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            aria-label="Clear customer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : isLoading && open ? (
          <Loader2 className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        ) : null}
      </div>

      {selectedCustomer && value && !open && (
        <p className="text-[10px] text-gray-500 mt-1.5 truncate">
          {[selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(' · ')}
        </p>
      )}

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl py-1"
        >
          {isLoading ? (
            <li className="px-3 py-2.5 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              Searching…
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-500">
              No customers match your search.
            </li>
          ) : (
            results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={customer.id === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(customer)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-gray-800 transition-colors ${
                    customer.id === value ? 'bg-blue-600/10' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-100">
                    <User className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                    {customer.name}
                  </span>
                  {(customer.email || customer.phone) && (
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 pl-5 text-xs text-gray-500">
                      {customer.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {customer.phone}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
