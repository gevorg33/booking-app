import api, { unwrap } from '../services/api';

export interface ProviderRetailProduct {
  id: string;
  name: string;
  sku: string | null;
  retailPrice: number;
  quantityOnHand: number;
}

export interface ProviderRetailSaleLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProviderRetailCheckout {
  lines: ProviderRetailSaleLine[];
  retailTotal: number;
  currency: string;
}

export async function fetchProviderRetailProducts(
  businessId: string,
): Promise<ProviderRetailProduct[]> {
  const { data } = await api.get(
    `/businesses/${businessId}/provider/retail-pos/products`,
  );
  return unwrap<{ products: ProviderRetailProduct[] }>(data).products;
}

export async function fetchProviderBookingRetailSales(
  businessId: string,
  bookingId: string,
): Promise<ProviderRetailCheckout> {
  const { data } = await api.get(
    `/businesses/${businessId}/provider/bookings/${bookingId}/retail-sales`,
  );
  return unwrap<ProviderRetailCheckout>(data);
}

export async function saveProviderBookingRetailSales(
  businessId: string,
  bookingId: string,
  lines: Array<{ productId: string; quantity: number }>,
): Promise<ProviderRetailCheckout> {
  const { data } = await api.put(
    `/businesses/${businessId}/provider/bookings/${bookingId}/retail-sales`,
    { lines },
  );
  return unwrap<ProviderRetailCheckout>(data);
}
