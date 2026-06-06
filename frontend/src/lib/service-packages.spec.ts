import { describe, it, expect } from 'vitest';
import {
  buildPackageItemsPayload,
  defaultPackageFormState,
  formatPackageSavings,
  isPackageExpired,
  packageLocalizedNamesPayload,
  packageToFormState,
  previewPackageFromForm,
  resolvePackageStatus,
  togglePackageServiceSelection,
} from './service-packages';

describe('service-packages', () => {
  it('resolves package status and expiration', () => {
    expect(resolvePackageStatus({ isActive: false, expiresAt: null })).toBe('inactive');
    expect(
      resolvePackageStatus({ isActive: true, expiresAt: '2099-01-01T00:00:00.000Z' }),
    ).toBe('active');
    expect(
      resolvePackageStatus({ isActive: true, expiresAt: '2020-01-01T00:00:00.000Z' }),
    ).toBe('expired');
    expect(isPackageExpired(null)).toBe(false);
    expect(isPackageExpired('2020-01-01T00:00:00.000Z')).toBe(true);
  });

  it('previews package pricing from form selections', () => {
    const preview = previewPackageFromForm({
      selectedItems: [
        { serviceId: 'svc-1', quantity: 1, unitPrice: 80 },
        { serviceId: 'svc-2', quantity: 2, unitPrice: 40 },
      ],
      discountType: 'percent',
      discountValue: 10,
    });
    expect(preview.regularTotal).toBe(160);
    expect(preview.packagePrice).toBe(144);
  });

  it('builds payload and toggles service selection', () => {
    expect(
      buildPackageItemsPayload(['svc-1', 'svc-2'], { 'svc-1': 2, 'svc-2': 0 }),
    ).toEqual([
      { serviceId: 'svc-1', quantity: 2 },
      { serviceId: 'svc-2', quantity: 1 },
    ]);
    expect(togglePackageServiceSelection(['svc-1'], 'svc-2')).toEqual(['svc-1', 'svc-2']);
    expect(togglePackageServiceSelection(['svc-1', 'svc-2'], 'svc-1')).toEqual(['svc-2']);
  });

  it('maps package record to form state and formats savings', () => {
    const form = packageToFormState({
      id: 'pkg-1',
      name: 'Spa day',
      discountType: 'percent',
      discountValue: 15,
      displayOrder: 2,
      isActive: true,
      expiresAt: '2099-06-01T23:59:59.000Z',
      items: [
        { serviceId: 'svc-1', quantity: 1, service: { id: 'svc-1', name: 'Massage', price: 80 } },
      ],
    });
    expect(form.selectedServiceIds).toEqual(['svc-1']);
    expect(form.expiresAtDay).toBe('2099-06-01');
    expect(formatPackageSavings(27, 15, 'USD')).toContain('15%');
  });

  it('handles empty preview selections and optional form fields', () => {
    expect(
      previewPackageFromForm({
        selectedItems: [],
        discountType: 'percent',
        discountValue: 10,
      }).regularTotal,
    ).toBe(0);

    const form = packageToFormState({
      id: 'pkg-1',
      name: 'Minimal',
      discountType: 'fixed',
      discountValue: 5,
      isActive: true,
    });
    expect(form.description).toBe('');
    expect(form.expiresAtDay).toBe('');
    expect(form.displayOrder).toBe('0');
    expect(buildPackageItemsPayload(['svc-1'], { 'svc-1': 3 })).toEqual([
      { serviceId: 'svc-1', quantity: 3 },
    ]);
  });

  it('formats savings with invalid currency fallback', () => {
    expect(formatPackageSavings(10, 20, 'NOT-A-CURRENCY')).toContain('10.00');
  });

  it('builds payload when service quantity key is missing', () => {
    expect(buildPackageItemsPayload(['svc-1'], {})).toEqual([
      { serviceId: 'svc-1', quantity: 1 },
    ]);
  });

  it('exposes package localized name helpers', () => {
    const form = defaultPackageFormState();
    form.localizedNames.en[0] = 'Spa EN';
    expect(packageLocalizedNamesPayload(form)).toEqual({ en: ['Spa EN'] });
  });
});
