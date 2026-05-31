export interface RetailProductView {
  id: string;
  name: string;
  sku: string | null;
  retailPrice: number;
  quantityOnHand: number;
}

export interface BookingRetailSaleView {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BookingRetailCheckoutView {
  lines: BookingRetailSaleView[];
  retailTotal: number;
  currency: string;
}
