import { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBusinessCurrency } from '../lib/use-business-currency';
import { formatBookingMoney } from '../lib/booking-payment-summary';
import {
  fetchProviderBookingRetailSales,
  fetchProviderRetailProducts,
  saveProviderBookingRetailSales,
} from '../lib/provider-retail-pos';
import {
  filterRetailProductsBySearchQuery,
  resolveQuickAddRetailProduct,
} from '../lib/provider-retail-pos-search.util';
import { useI18n } from '../i18n';

interface BookingRetailPosSectionProps {
  businessId: string;
  bookingId: string;
  currency?: string | null;
  disabled?: boolean;
  onSaved?: () => void;
}

export default function BookingRetailPosSection({
  businessId,
  bookingId,
  currency,
  disabled,
  onSaved,
}: BookingRetailPosSectionProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { currency: businessCurrency } = useBusinessCurrency();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHint, setSearchHint] = useState<string | null>(null);

  const money = (amount: number) =>
    formatBookingMoney(amount, currency ?? businessCurrency ?? 'USD', businessCurrency);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['provider-retail-products', businessId],
    queryFn: () => fetchProviderRetailProducts(businessId),
  });

  const { data: checkout, isLoading: salesLoading } = useQuery({
    queryKey: ['provider-booking-retail-sales', businessId, bookingId],
    queryFn: () => fetchProviderBookingRetailSales(businessId, bookingId),
  });

  useEffect(() => {
    if (!checkout) return;
    const next: Record<string, number> = {};
    for (const line of checkout.lines) {
      next[line.productId] = line.quantity;
    }
    setCart(next);
  }, [checkout]);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find((row) => row.id === productId);
        const unitPrice = product?.retailPrice ?? 0;
        return {
          productId,
          name: product?.name ?? 'Product',
          quantity,
          unitPrice,
          lineTotal: Math.round(unitPrice * quantity * 100) / 100,
        };
      });
  }, [cart, products]);

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines],
  );

  const visibleProducts = useMemo(
    () => filterRetailProductsBySearchQuery(products, searchQuery),
    [products, searchQuery],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      saveProviderBookingRetailSales(
        businessId,
        bookingId,
        cartLines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['provider-booking-retail-sales', businessId, bookingId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['provider-booking', businessId, bookingId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['provider-retail-products', businessId],
      });
      onSaved?.();
    },
  });

  const setQty = (productId: string, quantity: number, max: number) => {
    const next = Math.max(0, Math.min(max, quantity));
    setCart((prev) => ({ ...prev, [productId]: next }));
  };

  const handleQuickAdd = () => {
    const result = resolveQuickAddRetailProduct(products, searchQuery);
    switch (result.status) {
      case 'empty':
        setSearchHint(null);
        return;
      case 'exact_sku':
      case 'single_match': {
        const currentQty = cart[result.product.id] ?? 0;
        setQty(result.product.id, currentQty + 1, result.product.quantityOnHand);
        setSearchQuery('');
        setSearchHint(null);
        return;
      }
      case 'no_match':
        setSearchHint(t('retailPos.noSearchResults'));
        return;
      case 'ambiguous':
        setSearchHint(t('retailPos.ambiguousSearch'));
        return;
      case 'out_of_stock':
        setSearchHint(t('retailPos.outOfStock'));
        return;
      default:
        setSearchHint(null);
    }
  };

  if (productsLoading || salesLoading) {
    return (
      <div className="ion-margin-bottom empty-state">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <div className="ion-margin-bottom retail-pos-section">
      <h3>{t('retailPos.title')}</h3>
      <IonText color="medium">
        <p className="booking-meta">{t('retailPos.subtitle')}</p>
      </IonText>

      {products.length === 0 ? (
        <IonText color="medium">
          <p className="booking-meta">{t('retailPos.noProducts')}</p>
        </IonText>
      ) : (
        <>
          <div className="retail-pos-section__search">
            <IonSearchbar
              value={searchQuery}
              placeholder={t('retailPos.searchPlaceholder')}
              debounce={150}
              disabled={disabled}
              onIonInput={(event) => {
                setSearchQuery(event.detail.value ?? '');
                setSearchHint(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleQuickAdd();
                }
              }}
            />
            <IonButton
              size="small"
              fill="outline"
              disabled={disabled || !searchQuery.trim()}
              onClick={handleQuickAdd}
            >
              {t('retailPos.quickAdd')}
            </IonButton>
          </div>
          {searchHint ? (
            <IonText color="medium">
              <p className="booking-meta">{searchHint}</p>
            </IonText>
          ) : null}
          {visibleProducts.length === 0 ? (
            <IonText color="medium">
              <p className="booking-meta">{t('retailPos.noSearchResults')}</p>
            </IonText>
          ) : (
            <div className="retail-pos-section__products">
              {visibleProducts.map((product) => {
                const qty = cart[product.id] ?? 0;
                return (
                  <IonItem key={product.id} lines="full" className="retail-pos-row">
                    <IonLabel>
                      <h4>{product.name}</h4>
                      <p>
                        {product.sku ? (
                          <>
                            {t('retailPos.skuLabel')}: {product.sku} ·{' '}
                          </>
                        ) : null}
                        {money(product.retailPrice)} · {product.quantityOnHand}{' '}
                        {t('retailPos.inStock')}
                      </p>
                    </IonLabel>
                    <div className="retail-pos-row__qty" slot="end">
                      <IonButton
                        size="small"
                        fill="outline"
                        disabled={disabled || qty <= 0}
                        onClick={() =>
                          setQty(product.id, qty - 1, product.quantityOnHand)
                        }
                      >
                        −
                      </IonButton>
                      <span>{qty}</span>
                      <IonButton
                        size="small"
                        fill="outline"
                        disabled={disabled || qty >= product.quantityOnHand}
                        onClick={() =>
                          setQty(product.id, qty + 1, product.quantityOnHand)
                        }
                      >
                        +
                      </IonButton>
                    </div>
                  </IonItem>
                );
              })}
            </div>
          )}
        </>
      )}

      {cartLines.length > 0 && (
        <div className="retail-pos-section__summary">
          {cartLines.map((line) => (
            <div key={line.productId} className="retail-pos-section__line">
              <span>
                {line.name} × {line.quantity}
              </span>
              <span>{money(line.lineTotal)}</span>
            </div>
          ))}
          <div className="retail-pos-section__total">
            <span>{t('retailPos.retailTotal')}</span>
            <strong>{money(cartTotal)}</strong>
          </div>
        </div>
      )}

      <IonButton
        expand="block"
        className="ion-margin-top"
        disabled={disabled || saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? t('common.saving') : t('retailPos.saveCart')}
      </IonButton>
      {saveMutation.isError ? (
        <IonText color="danger">
          <p className="booking-meta">{t('feedback.failed')}</p>
        </IonText>
      ) : null}
    </div>
  );
}
